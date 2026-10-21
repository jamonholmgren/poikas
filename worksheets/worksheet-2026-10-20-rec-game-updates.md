# Fall 2026 Rec game updates

- Status: COMPLETE
- Source: User reports for August 22, August 29, September 12, September 26, and October 3, 10, and 17. Follow-up to the CC updates in the adjacent worksheet.
- August 22, August 29, and September 12 already match all supplied stats. Preserve the previously recorded August 22 goalie and September 12 Brenna debut note.
- Fill the four pending games September 26 through October 17. Use canonical roster names; October 17 is `lost-ot` because it ended in a shootout. Do not infer the October 10 goalie.
- October 10 shots: use reported 36–9, preserve user's alternative estimate 42–14 in the notable. Sisu “not here” means AWOL, no player award.
- User asked to find September 19 on MVIA and compare basic Rec stats. Official game page confirms a 3–2 regulation win: https://mountainview.ezleagues.ezfacility.com/games/17216104/Slavic-Peeps-vs-Suomi-Poikas.aspx . No shots, individual stats, or goalie on the game page, so these remain absent.
- All nine completed scores match the official team schedule: https://mountainview.ezleagues.ezfacility.com/teams/3235421/Suomi-Poikas.aspx . Rec is 8–0–1 in the site's W–L–ties/OT-loss format (arena: 8 wins, 1 loss including 1 OTL), 47 GF / 13 GA.
- Validation: all nine completed scores and all 11 future dates/opponents/times match MVIA; game goal totals match individual reports; team totals match MVIA (47 GF / 13 GA).
- `bun test`: 29 pass, 0 fail (147 assertions); `git diff --check` passed. HTTP smoke checks passed for home, both Fall season pages, and Jamon's profile.
- Changed `src/data/poikas.ts` and `src/pages/pages.test.ts`; updated Rec description, season result checks, confirmed goalie totals, and affected career-stat expectations. Reviewed the final diff. Commit and push with this worksheet under the season-maintenance workflow.
