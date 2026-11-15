"""Bounded host operations through the existing Poikas deployment identity.
No arbitrary commands or credential output. Only the Poikas service is changed.
"""
import json, os, re, subprocess, sys, urllib.parse
remote = os.environ['CUSTOM_REMOTE_URL']
if remote.startswith('ssh://'):
    u = urllib.parse.urlparse(remote)
    if u.password: raise SystemExit('Password URLs are not supported')
    host = ((u.username + '@') if u.username else '') + u.hostname
    port, repo = u.port or 22, u.path
else:
    m = re.fullmatch(r'([^\s:]+):(.+)', remote)
    if not m: raise SystemExit('Expected the existing SSH deployment remote')
    host, repo, port = m[1], m[2], 22
if not re.fullmatch(r'[a-zA-Z0-9_.@-]+', host) or not re.fullmatch(r'[a-zA-Z0-9_./~-]+', repo): raise SystemExit('Unsupported remote syntax')
action = sys.argv[1] if len(sys.argv) == 2 else ''
if action not in ('inspect', 'configure', 'verify', 'enable'): raise SystemExit('Unsupported host action')
script = r'''
import hashlib, json, os, pathlib, shutil, stat, subprocess, sys, tempfile, time, urllib.request, uuid
repo = pathlib.Path(sys.argv[1]).expanduser().resolve()
action = sys.argv[2]
settings = json.load(sys.stdin)
project = repo.parent
if repo.name != 'deploy.git' or project != pathlib.Path('/root/poikas-app'): raise SystemExit('Unexpected Poikas project path; no changes made')
private = pathlib.Path('/root/poikas-team-data')
unit = 'poikas-server.service'
config = pathlib.Path('/etc/systemd/system/poikas-server.service.d/team-room.conf')
def run(args): subprocess.run(args, check=True)
def ready():
 for _ in range(40):
  try:
   with urllib.request.urlopen('http://127.0.0.1:5151/team/api/state', timeout=2) as r: return json.load(r)
  except Exception: time.sleep(.5)
 raise SystemExit('Poikas service did not become ready')
def marker(): return hashlib.sha256((private / 'persistence-check').read_bytes()).hexdigest()
def verify():
 if private.is_relative_to(project): raise SystemExit('Private data must be outside deployment')
 if stat.S_IMODE(private.stat().st_mode) != 0o700: raise SystemExit('Private directory permissions are incorrect')
 for name in ('state.json','auth.json'):
  path=private/name
  if stat.S_IMODE(path.stat().st_mode) != 0o600: raise SystemExit('Private JSON permissions are incorrect')
  with path.open() as f: value=json.load(f)
  if value.get('version') != 1: raise SystemExit('Unexpected JSON format')
 if not json.loads((private/'auth.json').read_text()).get('adminHash'): raise SystemExit('Admin is not initialized')
 if settings.get('expected') and marker() != settings['expected']: raise SystemExit('Persistence marker changed')
 run(['systemctl','is-active','--quiet',unit])
 print('Persistence fingerprint:', marker())
 print('Private JSON intact outside the checkout, with owner-only permissions.')
if action == 'inspect':
 print('Poikas repository:', repo)
 print(subprocess.run(['systemctl','show',unit,'-p','User','-p','WorkingDirectory','-p','FragmentPath'],text=True,capture_output=True).stdout.strip())
 print('Persistent team directory exists:',private.exists())
 if private.exists() and (private/'persistence-check').exists(): verify()
elif action == 'configure':
 password=settings.get('password','')
 if len(password) < 8: raise SystemExit('Admin password must contain at least 8 characters')
 private.mkdir(mode=0o700,exist_ok=True);private.chmod(0o700)
 check=private/'persistence-check'
 if not check.exists(): check.write_text(uuid.uuid4().hex);check.chmod(0o600)
 bun=shutil.which('bun') or '/root/.bun/bin/bun'
 fd,path=tempfile.mkstemp(prefix='admin-',dir=private)
 try:
  with os.fdopen(fd,'w') as f:f.write(password)
  auth=private/'auth.json'
  if not auth.exists() or not json.loads(auth.read_text()).get('adminHash'):
   run([bun,str(project/'scripts/team-admin.ts'),str(private),path])
 finally: os.unlink(path)
 code="import {JsonStore,blankState} from './src/team/store';const s=new JsonStore(process.argv[1]);s.change('state',blankState,()=>{});"
 subprocess.run([bun,'-e',code,str(private)],check=True,cwd=project)
 config.parent.mkdir(exist_ok=True)
 config.write_text('[Service]\nEnvironment=POIKAS_DATA_DIR='+str(private)+'\nEnvironment=POIKAS_ORIGIN=https://suomipoikas.com\nEnvironment=POIKAS_WRITES_ENABLED=0\n')
 run(['systemctl','daemon-reload']);run(['systemctl','restart',unit]);ready();verify()
 print('Private storage configured. Writes remain disabled pending persistence verification.')
elif action == 'verify':
 if not settings.get('expected'):raise SystemExit('Expected persistence fingerprint is required')
 verify();status=ready();print('Writes enabled:',status['enabled'],'Admin configured:',status['adminReady'])
elif action == 'enable':
 if not settings.get('expected'):raise SystemExit('Expected persistence fingerprint is required')
 verify()
 old=config.read_text()
 if 'POIKAS_WRITES_ENABLED=0' not in old and 'POIKAS_WRITES_ENABLED=1' not in old:raise SystemExit('Unexpected service configuration')
 config.write_text(old.replace('POIKAS_WRITES_ENABLED=0','POIKAS_WRITES_ENABLED=1'))
 run(['systemctl','daemon-reload']);run(['systemctl','restart',unit])
 status=ready()
 if not status['enabled'] or not status['adminReady']:raise SystemExit('Team room did not enable')
 verify();print('Team-room writes enabled.')
'''
def quote(s): return "'" + s.replace("'", "'\\''") + "'"
payload = {'expected': os.environ.get('EXPECTED_MARKER','')}
if action == 'configure': payload['password'] = os.environ.get('POIKAS_TEAM_ADMIN_PASSWORD','')
subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=15','-p',str(port),host,'python3 -c ' + quote(script) + ' ' + quote(repo) + ' ' + quote(action)], input=json.dumps(payload), text=True, check=True)
