import type { Player, PoikasData } from "../types"
import { routePage } from "../route"

export function AllPlayersPage(data: PoikasData) {
  const players = data.players.sort((a, b) => (a.name > b.name ? 1 : -1))

  return routePage({
    path: "/players/",
    title: "All Poikas Players",
    description: "All Poikas Players All Time",
    metaImage: "/images/finland-flag-icon.png",
    sidebar: `
      <img src="/images/poikas-rec-2023-fall-champions.jpg" alt="Poikas" />
      <span class="caption">Poikas</span>
    `,
    main: `
      <article>
        <h2>All Players</h2>
        <table id="players" class="roster">
          <thead>
            <tr>
              <th width="50">Img</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Num</th>
              <th class="extra">Ht</th>
              <th class="extra">Wt</th>
              <th class="extra">Age</th>
              <th class="extra">Rec</th>
              <th class="extra">C/CC</th>
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
                <td class="extra">${p.recLink || "-"}</td>
                <td class="extra">${p.cLink || "-"}</td>
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
