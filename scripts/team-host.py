"""Bounded Poikas host inspection using the existing CI deployment identity.
Does not print credentials or accept arbitrary commands.
"""
import os, re, subprocess, sys, urllib.parse
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
if sys.argv[1:] != ['inspect']: raise SystemExit('Only read-only inspect is supported')
script = r'''
import os, pathlib, subprocess, sys
repo = pathlib.Path(sys.argv[1]).expanduser().resolve()
print('Poikas repository:', repo)
print('Service account:', subprocess.check_output(['id','-un'],text=True).strip())
print('Project entries:', ', '.join(p.name for p in repo.parent.iterdir()))
hook = repo / 'hooks/post-receive'
if hook.exists():
 print('Deployment hook:')
 for line in hook.read_text().splitlines():
  if any(word in line for word in ('cd ', 'bun ', 'systemctl', 'supervisor', 'pm2', 'git ', 'source ', '.env')):
   if re_search := __import__('re').search(r'(?i)(password|token|secret|api.key)',line): print('[credential-bearing line omitted]')
   else: print(line)
result = subprocess.run(['systemctl','list-unit-files','--no-legend'],text=True,capture_output=True)
for line in result.stdout.splitlines():
 if 'poikas' in line.lower():
  unit=line.split()[0]
  print('UNIT',unit)
  print(subprocess.run(['systemctl','show',unit,'-p','User','-p','WorkingDirectory','-p','FragmentPath'],text=True,capture_output=True).stdout.strip())
'''
def quote(s): return "'" + s.replace("'", "'\\''") + "'"
subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=15','-p',str(port),host,'python3 -c ' + quote(script) + ' ' + quote(repo)], check=True)
