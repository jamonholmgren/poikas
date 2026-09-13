---
name: poikas-season-maintenance
description: Update Suomi Poikas season schedules, game reports, roster data, and MVIA arena statistics. Use for recording new games, closing a season, adding a current season, or reconciling Poikas data with Mountain View Ice Arena. Do not use for unrelated site edits.
---

# Poikas season maintenance

Keep the site’s team data accurate without inventing missing game details.

## Data locations

- Current and recent season data: `src/data/poikas.ts`
- Older manually tracked seasons: `src/data/poikas-previous.ts`
- MVIA season aggregates: `src/data/historical/hockey_stats_rec.json` and `src/data/historical/hockey_stats_c.json`
- Rendering and derived stats: `src/data/load.ts`, `src/pages/LeaguePage.ts`, and `src/pages/HomePage.ts`

## Update workflow

1. Inspect the applicable season, player names, existing tests, and the working tree before editing.
2. Treat user-supplied game reports as the source for score, shots, Sisu Cup, goalie, notable events, and explicitly listed player stats. Use canonical full player names from `poikasData.players`.
3. Do not infer unreported assists, penalties, goalies, or individual stats. Leave unknown fields absent; a short notable can state that details are incomplete when useful.
4. For current schedules and arena-reported aggregate stats, verify against the official MVIA EZFacility team or league page. Add every confirmed future game, including its time in `notable` when no better time field exists.
5. A season with `playoffs: "pending"` is treated as current. When a new current Rec or CC season begins, replace `pending` on the completed season with the appropriate result (for example, `champions`, `eliminated`, or `eliminated-championship`) before adding the new one.
6. Use the arena aggregate JSON for completed-season player and goalie totals when available. `C` is the arena’s label for the site’s `CC` league. Ensure arena player and goalie names match the site’s canonical player names so `load.ts` can attach the totals. Do not assign a goalie to a game merely to fill a gap when only aggregate arena goalie data is known.
7. Add or update focused tests in `src/pages/pages.test.ts` when the rendered current season, known game result, or aggregate career total changes.

## Validation and handoff

Run `bun test`. For a local smoke test, run `bun start` and check the current season and home routes at `http://localhost:5151`.

Review `git diff --check` and the staged diff. After successful validation, commit the completed in-scope changes with a concise message and push them to the configured upstream branch. Report the commit and test result.
