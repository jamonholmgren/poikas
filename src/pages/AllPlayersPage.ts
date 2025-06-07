import type { PoikasData } from "../types"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

export function AllPlayersPage(data: PoikasData) {
  return routePage({
    path: "/players/",
    title: "All Poikas Players",
    description: "All Poikas Players All Time",
    metaImage: img("finland-flag-icon.png"),
    sidebar: `
      <img src="${img("poikas-rec-2023-fall-champions.jpg")}" alt="Poikas" />
      <span class="caption">Poikas</span>
    `,
    main: `
      <article>
        <h2>All Players</h2>
        ${renderRosterTable({
          id: "players",
          className: "roster",
          columns: [
            { th: "Img", val: "imageHTML", width: 50, txt: "Player image" },
            { th: "Name", val: "profileLink", txt: "Player name" },
            { th: "Pos", val: "pos", txt: "Player position" },
            { th: "Num", val: "number", txt: "Player jersey number" },
            { th: "Ht", val: "ht", txt: "Height", xtra: true },
            { th: "Wt", val: "wt", txt: "Weight", xtra: true },
            { th: "Age", val: "age", txt: "Age (approximately)", xtra: true },
            { th: "G", val: "careerStats.goals", txt: "Career goals", xtra: true },
            { th: "A", val: "careerStats.assists", txt: "Career assists", xtra: true },
            { th: "P", val: "careerStats.points", txt: "Career points (goals + assists)", xtra: true },
            { th: "PNL", val: "careerStats.penalties", txt: "Career penalties\n(since we started\ncounting in 2024)", xtra: true },
            { th: "Rec", val: "seasons.Rec.length", txt: "Total rec seasons played", xtra: true },
            { th: "C/CC", val: "seasons.C.length", txt: "Total C/CC seasons played", xtra: true },
          ],
          players: data.players.sort((a, b) => (a.name > b.name ? 1 : -1)),
        })}
      </article>
    `,
  })
}
