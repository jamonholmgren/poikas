# EZFacility Historical Stats Worksheet

Date: 2026-06-03

## Goal

Implement the goalie stat fixes and build a repeatable local workflow for EZFacility historical HTML:

- Add missing EZFacility schedule/team links in `src/data/poikas-previous.ts`.
- Fix arena stat attachment for CC seasons.
- Prevent ignored goalie-stat seasons from showing misleading `0.0%` / `0.0`.
- Archive EZFacility schedule/team HTML locally.
- Add tooling to discover Suomi team URLs from EZFacility date schedule pages.
- Regenerate historical JSON from archived HTML without requiring live network in tests.
- Write and run tests.
- Make progress commits directly on `main`.

## User Preferences

- Avoid fallbacks unless content truly may be absent.
- Match the existing code style.
- Keep this worksheet current enough that another agent can resume from it.
- Include commit messages and useful commands.
- Do not make `bun test` depend on EZFacility/network.

## Starting Worktree

At start, these files already had modifications:

- `src/data/load.ts`
- `src/data/poikas-previous.ts`
- `src/pages/pages.test.ts`
- `src/types.ts`

Those changes added the initial arena goalie stat fallback, one Rec 2023 Spring schedule link, and a goalie fallback test. Treat them as existing work and build on them.

## Useful Commands

- `bun test`
- `bun run src/data/historical/ezfacility.ts discover --write`
- `bun run src/data/historical/ezfacility.ts fetch --write`
- `bun run src/data/historical/ezfacility.ts parse --write-json`
- `bun run src/data/historical/ezfacility.ts regen`

Live EZFacility fetches require network access. Tests should only use checked-in/local data.

## Implementation Notes

The EZFacility pages checked so far are server-rendered:

- Date schedule pages expose normal relative `teams/...` links.
- Team pages expose standings, schedule, roster, player stats, and goalie stats in HTML/text.

Known samples:

- `schedule.aspx?facility_id=2042&d=10%2f14%2f2023&framed=1` includes `teams/2902712/Suomi-Poikas-Rec.aspx`.
- `schedule.aspx?facility_id=2042&d=10%2f15%2f2023&framed=1` includes `teams/2902820/Suomi-Poikas-C.aspx`.

## Progress Log

- Created worksheet.
- Fixed CC arena stat attachment by matching EZFacility `C` to app `CC`.
- Added missing schedule URLs for the supplied older Rec/CC seasons, excluding Rec 2020 Spring.
- Cleared `ignoreGoalieStats` on seasons with reliable listed arena links/stats.
- Kept ignored seasons rendering goalie GAA/SV%/SA/G/SO as `-` instead of fake `0.0%` values.
- Corrected 2022 Fall CC local goalie attribution from Jamon Holmgren to Erik Benton and corrected the checked-in arena goalie row.
- Expanded the arena goalie fallback so seasons without local game lists can use arena GP/W-L/GA when a matching arena goalie row exists.
- Added regression tests for older Rec/CC arena goalie stats, Erik Benton in 2022 Fall CC, and ignored-season rendering.
- Ran `bun test`: 12 pass, 0 fail.

## Commits

- Pending commit: `Fix historical goalie stat display`
