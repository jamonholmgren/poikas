# Fall 2026 CC game updates

- Status: COMPLETE
- Source: User's reports for September 13 through October 18, 2026; CC only. Rec reports will follow separately.
- Starting commit: `4f1dc8058c89cc865e166562214c87935b4e3593`; working tree clean.
- No applicable AGENTS.md files found in the checkout or its ancestor directories.
- Update the six scheduled games with supplied scores, shots, known stats, Sisu details, and notes. Use roster names; omit unknown assists, penalties, and goalies. Add Brad Wuori to the CC roster for his reported participation.
- September 13 is a 0–1 forfeit. Existing forfeit support omits losses from standings and hides the score; make a focused correction and cover it with regression checks.
- Official CC team page fetched successfully with curl after the web tool could not open it. All 11 remaining games match its dates, opponents, and times; no schedule changes needed.
- Updated `src/data/poikas.ts`, `src/data/load.ts`, `src/pages/LeaguePage.ts`, `src/pages/OpponentPage.ts`, and `src/pages/pages.test.ts`.
- Sisu is recorded as AWOL when no player received the cup; notes preserve its whereabouts in Ward's truck. Unconfirmed September 27 penalty estimate (user: “2-3 ?”) is not assigned to any player. Other missing stats and unreported goalies remain absent.
- Corrected season and opponent loss counts for forfeits and displayed the known forfeit score.
- Validation: `bun test` — 29 passed, 0 failed. Updated the existing career goalie expectations for the two newly reported Jamon starts; checked five confirmed Fall CC starts, 136 shots against, 19 goals against.
- Local smoke checks returned HTTP 200 for `/`, `/seasons/2026/fall/cc`, `/vs/jugs`, and `/players/brad-wuori`; checked the latest home result and rendered forfeit score. All five played reports have individual goal totals matching their scores.
- Reviewed the in-scope diff; `git diff --check` passed. Commit and push this worksheet with the data, rendering corrections, and tests per the season-maintenance skill. No Rec data was changed.
