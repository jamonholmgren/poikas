import { readFileSync, mkdirSync, writeFileSync, chmodSync } from "node:fs"
import { join, resolve } from "node:path"
import { validBackup } from "../src/team/store"
// Input is an admin download or a server-private daily backup, never a public endpoint.
const input = process.argv[2]
if (!input) throw new Error("Usage: bun scripts/team-backup.ts /path/to/private-download.json")
const backup = JSON.parse(readFileSync(input, "utf8"))
if (!validBackup(backup)) throw new Error("Invalid private Poikas backup; no files were written.")
const root = resolve(import.meta.dir, ".."),
  dir = join(root, ".private-backups")
mkdirSync(dir, { recursive: true, mode: 0o700 })
chmodSync(dir, 0o700)
writeFileSync(join(dir, "latest.json"), JSON.stringify(backup, null, 2) + "\n", { mode: 0o600 })
chmodSync(join(dir, "latest.json"), 0o600)
// Only public MVIA schedule fields are safe to commit. This is NOT a full attendance backup.
const schedule = backup.state.schedule.map(({ id, key, league, season, date, time, vs, cancelled }: any) => ({ id, key, league, season, date, time, vs, cancelled }))
mkdirSync(join(root, "backups"), { recursive: true })
writeFileSync(
  join(root, "backups/team-schedule.json"),
  JSON.stringify({ version: 1, savedAt: backup.savedAt, lastSync: backup.state.sync.lastSuccess || null, schedule }, null, 2) + "\n",
)
console.log("Full backup saved privately to .private-backups/latest.json. Only backups/team-schedule.json may be committed.")
