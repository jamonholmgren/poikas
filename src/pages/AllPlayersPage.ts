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
            { h: "Img", v: "imageHTML", width: 50, t: "Player image" },
            { h: "Name", v: "profileLink", t: "Player name" },
            { h: "Pos", v: "pos", t: "Player position" },
            { h: "Num", v: "number", t: "Player jersey number" },
            { h: "Ht", v: "ht", t: "Height", isExtra: true },
            { h: "Wt", v: "wt", t: "Weight", isExtra: true },
            { h: "Age", v: "age", t: "Age (approximately)", isExtra: true },
            { h: "G", v: "careerStats.goals", t: "Career goals", isExtra: true },
            { h: "A", v: "careerStats.assists", t: "Career assists", isExtra: true },
            { h: "P", v: "careerStats.points", t: "Career points (goals + assists)", isExtra: true },
            { h: "PNL", v: "careerStats.penalties", t: "Career penalties\n(since we started\ncounting in 2024)", isExtra: true },
            { h: "Rec", v: "seasons.Rec.length", t: "Total rec seasons played", isExtra: true },
            { h: "C/CC", v: "seasons.C.length", t: "Total C/CC seasons played", isExtra: true },
          ],
          players: data.players.sort((a, b) => (a.name > b.name ? 1 : -1)),
        })}
      </article>
    `,
  })
}
