import type { Player, PoikasData } from "../types"
import { routePage } from "../route"
import { img } from "../image"

export function AllPlayersPage(data: PoikasData) {
  const players = data.players.sort((a, b) => (a.name > b.name ? 1 : -1))

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
        <table id="players" class="roster">
          <thead>
            <tr>
              <th width="50" title="Player image">Img</th>
              <th title="Player name">Player</th>
              <th title="Player position">Pos</th>
              <th title="Player jersey number">Num</th>
              <th class="extra" title="Height">Ht</th>
              <th class="extra" title="Weight">Wt</th>
              <th class="extra" title="Age (approximately)">Age</th>
              <th class="extra" title="Career goals">G</th>
              <th class="extra" title="Career assists">A</th>
              <th class="extra" title="Career points (goals + assists)">P</th>
              <th class="extra" title="Career penalties\n(since we started\ncounting in 2024)">PNL</th>
              <th class="extra" title="Total rec seasons played">Rec</th>
              <th class="extra" title="Total C/CC seasons played">C/CC</th>
            </tr>
          </thead>
          <tbody>
            ${players
              .map(
                (p) => `
              <tr>
                <td>${p.imageHTML || "-"}</td>
                <td>${p.profileLink || "-"}</td>
                <td>${p.pos || "-"}</td>
                <td>${p.number || "-"}</td>
                <td class="extra">${p.ht || "-"}</td>
                <td class="extra">${p.wt || "-"}</td>
                <td class="extra">${p.age() || "-"}</td>
                <td class="extra">${p.careerStats.goals || "-"}</td>
                <td class="extra">${p.careerStats.assists || "-"}</td>
                <td class="extra">${p.careerStats.points || "-"}</td>
                <td class="extra">${p.careerStats.penalties || "-"}</td>
                <td class="extra">${p.seasons.Rec.length || "-"}</td>
                <td class="extra">${p.seasons.C.length || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </article>

      `,
  })
}
