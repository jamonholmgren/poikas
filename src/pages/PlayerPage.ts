import type { PoikasData } from "../types"
import { Champ } from "../components/Champ"
import { sisuCups } from "../utils/sisuCups"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { notableAbbr } from "../utils/notableAbbr"
import { images } from "../data/images"
import { routePage } from "../route"
import { img } from "../image"

export function PlayerPage(data: PoikasData, slug: string) {
  const player = data.players.find((p) => p.slug === slug)
  if (!player) return new Response(`Player ${slug} not found`, { status: 404 })

  // find next and previous alphabetical player
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1))
  const prevPlayer = data.players.find((p) => p.name < player.name)
  data.players.reverse()
  const nextPlayer = data.players.find((p) => p.name > player.name)

  const recSeasons = player.leagues.filter((s) => s.level === "Rec").length || "—"
  const cSeasons = player.leagues.filter((s) => s.level === "C").length || "—"

  const playerImages = images.filter((img) => img.players.includes(player.name))

  return routePage({
    path: player.profileURL,
    title: player.name,
    description: player.bio || "",
    metaImage: player.imageURL,
    sidebar: `
      <img
        src="${player.imageURL}"
        alt="${player.name} - Player Photo"
        id="playerimage"
        onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
      />
      <span class="caption" id="playerimagecaption">${player.name}</span>`,
    main: `
      <article>
        <h2 id="playername">${player.name}</h2>
        <p id="bio">${player.bio || ""}</p>

        <h2>Player Sheet</h2>
        <table class="statsheet" id="statsheet">
          <tr>
            <th>Position</th>
            <td>${player.pos || "-"}</td>
          </tr>
          <tr>
            <th>Number</th>
            <td>${player.number || "-"}</td>
          </tr>
          <tr>
            <th>Age</th>
            <td>${player.age() || "-"}</td>
          </tr>
          <tr>
            <th>Height</th>
            <td>${player.ht || "-"}</td>
          </tr>
          <tr>
            <th>Weight</th>
            <td>${player.wt || "-"}</td>
          </tr>
          <tr>
            <th>Shoots</th>
            <td>${player.shoots || "-"}</td>
          </tr>
          <tr>
            <th>Joined</th>
            <td>${player.startYear || "-"}</td>
          </tr>
          <tr>
            <th>Years</th>
            <td>${player.years || "-"}</td>
          </tr>
          <tr>
            <th>Rec Seasons</th>
            <td>${recSeasons}</td>
          </tr>
          <tr>
            <th>C/CC Seasons</th>
            <td>${cSeasons}</td>
          </tr>
          <tr>
            <th>Championships</th>
            <td>${Champ(player)}</td>
          </tr>
        </table>
      </article>

      ${
        playerImages.length
          ? `
            <h2>Photos</h2>
            <table id="photos" class="photos">
              <tbody>
                ${playerImages
                  .reduce(
                    (rows, im, index) => {
                      if (index % 4 === 0) {
                        rows.push("<tr>")
                      }
                      rows.push(`
                      <td>
                        <a href="${im.path}" target="_blank">
                          <img src="${im.path}" alt="${im.caption}" title="${
                        im.caption
                      }" width="250px" onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';" />
                          <span class="caption">${im.caption}</span>
                        </a>
                      </td>
                    `)
                      if (index % 4 === 3 || index === playerImages.length - 1) {
                        rows.push("</tr>")
                      }
                      return rows
                    },
                    [""]
                  )
                  .join("")}
              </tbody>
            </table>
          `
          : ""
      }
      
      <div class="seasons">
        <h2>Seasons Played with the Poikas</h2>
        <table id="seasons" class="seasons">
          <thead>
            <tr>
              <th data-field="season">Season</th>
              <th data-field="rec">Rec League</th>
              <th data-field="c">C/CC League</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(leagueSeasonsMap(player.leagues))
              .map(
                ([season, leagues]) => `
            <tr>
              <td>${season}</td>
              <td>${leagues.rec || "—"}</td>
              <td>${leagues.c || "—"}</td>
            </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="sisucup">
        <h2>Sisu Cups Won</h2>
        <p>
          The "Sisu Cup" is awarded to the player who demonstrates the most
          <strong>sisu</strong> <em>(pronounced – see’-soo)</em> in a game.
          Sisu is a Finnish word that doesn't have a precise equivalent in
          English, but is similar to "guts" or "grit" or "perseverance".
        </p>
        <table id="sisucup" class="seasons">
          <thead>
            <tr>
              <th data-field="season">Season</th>
              <th data-field="date">Date</th>
              <th data-field="game">Game</th>
              <th data-field="sisu">Score</th>
              <th data-field="notable" class="extra">Notable</th>
            </tr>
          </thead>
          <tbody>
            ${sisuCups(player)
              .map(
                (cup) => `
            <tr>
              <td>${cup.season}</td>
              <td>${cup.date}</td>
              <td>${cup.game}</td>
              <td>${cup.score}</td>
              <td class="extra">${notableAbbr(cup.notable, 80)}</td>
            </tr>
                `
              )
              .join("")}

          </tbody>
        </table>
        <div class="prevnext">
          ${prevPlayer ? `<a href="${prevPlayer.profileURL}" id="prev">← ${prevPlayer.name}</a>` : ""}
          ${nextPlayer ? `<a href="${nextPlayer.profileURL}" id="next">${nextPlayer.name} →</a>` : ""}
        </div>
      </div>
    `,
    footer: ``,
  })
}
