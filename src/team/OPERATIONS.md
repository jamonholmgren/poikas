# Team room

The existing Bun server serves `/team` and `/team/admin`. Stats stay in the existing source files. Team attendance, notes, roster additions, lines, login hashes and sessions are JSON files; no database or external login service is used.

## Deployment

Use a single Bun service. Set `POIKAS_DATA_DIR` to an absolute private directory outside the checkout/release folder, owned by the service user, with mode 700. Never serve that directory with nginx or put it in Git. Configure nginx to overwrite `X-Real-IP` with the connected client address. `POIKAS_ORIGIN` defaults to `https://suomipoikas.com`.

1. Create the persistent directory and a private password file with a strong admin password (at least 16 characters).
2. Run `bun scripts/team-admin.ts /absolute/private/data /private/password-file` as the service user. Remove the input password file after retaining the password privately. It initializes only an absent admin; subsequent changes use the admin page.
3. Set `POIKAS_DATA_DIR` for the service, and verify a marker in that directory survives a normal deployment/restart. Verify mode/ownership and a valid JSON read/write as the service user. Do this before setting `POIKAS_WRITES_ENABLED=1`.
4. Enable writes and restart. Verify an authenticated test response survives a second normal deployment, then remove the test response. Do not delete or overwrite real team data during verification.
5. Admin: `/team/admin`. Copy player PIN setup links there and send them personally. The app never sends messages itself. Reset links expire in 24 hours and are one-use. Players get remembered sessions for 90 days; admin sessions expire in 12 hours. Login attempts are limited per player and client address for 15 minutes.

Without `POIKAS_WRITES_ENABLED=1`, the page reports setup in progress and rejects writes. Local development can use `.runtime/team` (gitignored). For local UI testing set `POIKAS_ORIGIN=http://localhost:5151`, a separate `POIKAS_DATA_DIR`, and enable writes.

## Attendance and schedules

In/Out is the record for future and past games. A player with recorded game stats or a recorded goalie appearance is automatically In, even if an older response says Out. No confirmation layer. Missing responses remain Not answered. Notes and lines are available only to signed-in team members or admin. An admin can edit responses and add a one-game fill-in or a roster player. Three-digit PINs, admin password hashes, sessions and reset tokens remain private.

Each current team's MVIA page is checked daily at 10 a.m. America/Los_Angeles (DST aware), with a startup catch-up and an admin refresh button. The timer runs in the Bun service. Failed parsing/fetches keep the saved schedule and show the last successful refresh. Existing source game links are mapped to MVIA game IDs on initial sync; later time/date changes preserve check-ins and lines. A game missing from a fetched page is retained; it is not silently deleted. Explicit cancellations are marked. Check the game page after any unusual arena rescheduling before sending a reminder. Source scores and player stats are never overwritten by this sync.

## Backups and restore

The private directory contains `state.json`, `auth.json`, and up to 30 daily backups under `backups/`. Writes are locked, fsynced, and atomically renamed. Never manually edit JSON while the service is running.

Admin's **Download backup** exports a full private JSON backup. **Restore backup** validates it, retains a private pre-restore copy, replaces team-room state and authentication, and logs everyone out. Game stats are separate. Preserve the password corresponding to the restored backup.

After a game-results update, download/copy a current private backup to the Mac and run `bun scripts/team-backup.ts /path/to/download.json`. It keeps the full backup at `.private-backups/latest.json` (ignored) and exports ONLY public schedule fields to `backups/team-schedule.json`. Commit the latter with game updates if it changed. This public schedule export does not restore attendance or login data; full backups must stay private. Having the private download on the Mac gives an off-server copy.
