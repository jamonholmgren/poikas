import type { PoikasData, PoikasImage, Season, PlayerSeason, Player, PlayerStats, LeagueName } from "../types"
import { Champ } from "../components/Champ"
import { sisuCups } from "../utils/sisuCups"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { notableAbbr } from "../utils/notableAbbr"
import { images } from "../data/images"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

type SeasonData = {
  seasonLink: string
  record: string
  stats?: PlayerStats
  isGoalie: boolean
}

export function PlayerPage(data: PoikasData, slug: string) {
  const player = data.players.find((p) => p.slug === slug)
  if (!player) return new Response(`Player ${slug} not found`, { status: 404 })

  // find next and previous alphabetical player
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1))
  const prevPlayer = data.players.find((p) => p.name < player.name)
  data.players.reverse()
  const nextPlayer = data.players.find((p) => p.name > player.name)

  const recSeasons = player.seasons.Rec.length || "—"
  const cSeasons = player.seasons.C.length || "—"

  const playerImages = images.filter((img: PoikasImage) => img.players.includes(player.name))
  // Also add images from the player's seasons
  const playerSeasonImages = player.seasons.Rec.concat(player.seasons.C)
    .map((s) => (s.season.photos && s.season.photos.length ? s.season.photos.slice(0, 1) : []))
    .flat()
    .filter((im) => typeof im === "string")
    .map((im: string) => ({
      path: im,
      caption: im,
    }))
  const allImages = [...playerImages, ...playerSeasonImages]

  const rec = player.activeSeasons?.Rec
  const c = player.activeSeasons?.C
  const careerGoals = player.careerStats?.goals || 0
  const careerAssists = player.careerStats?.assists || 0

  // Helper function to build season data for a specific league
  function buildSeasonData(player: Player, leagueName: "Rec" | "C"): SeasonData[] {
    return player.seasons[leagueName].map((playerSeason: PlayerSeason) => {
      const { season, stats } = playerSeason
      const record = `${season.wins || 0}-${season.losses || 0}${season.ties ? `-${season.ties}` : ""}`
      const seasonLink = season.link

      return {
        seasonLink,
        record,
        stats,
        isGoalie: player.pos === "G",
      }
    })
  }

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
          ${rec && activeStats(rec)}
          ${c && activeStats(c)}
          <tr>
            <th>Career Goals</th>
            <td>${careerGoals || "-"}</td>
          </tr>
          <tr>
            <th>Career Assists</th>
            <td>${careerAssists || "-"}</td>
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
        allImages.length
          ? `
            <h2>Photos</h2>
            <table id="photos" class="photos">
              <tbody>
                ${allImages
                  .reduce(
                    (rows, im, index) => {
                      if (index % 3 === 0) {
                        rows.push("<tr>")
                      }
                      rows.push(`
                      <td>
                        <a href="${img(im.path)}" target="_blank">
                          <img src="${img(im.path)}" alt="${im.caption}" title="${im.caption}" width="250px" onerror="this.onerror=null;this.src='${img(
                        "000-placeholder.jpg"
                      )}';" />
                          <span class="caption">${im.caption}</span>
                        </a>
                      </td>
                    `)
                      if (index % 3 === 2 || index === playerImages.length - 1) {
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
        <h2>Stats</h2>
        ${Object.keys(player.seasons)
          .map((k: string) =>
            player.seasons[k as LeagueName].length > 0
              ? `
              <h3>${k} League Seasons</h3>
              ${renderRosterTable<SeasonData>({
                id: "${k}-seasons",
                className: "seasons",
                columns: [
                  { th: "Season", val: "seasonLink", width: 200, alt: "Season name and link" },
                  { th: "Team Record", val: "record", width: 100, alt: "Team record" },
                  ...(player.pos === "G"
                    ? [
                        { th: "GP", width: 50, alt: "Games played", val: "stats.goalieGamesPlayed" },
                        { th: "Rec", width: 50, alt: "Record", val: "stats.goalieRecord" },
                        { th: "GAA", width: 50, alt: "Goals against average", val: "stats.goalsAgainstAverage" },
                        { th: "SV%", width: 50, alt: "Save percentage", val: "stats.savePercentage" },
                        { th: "SA/G", width: 50, alt: "Shots against per game", val: "stats.averageShotsAgainst" },
                        { th: "SO", width: 50, alt: "Shutouts", val: "stats.shutouts" },
                      ]
                    : []),
                  { th: "G", width: 50, alt: "Goals", val: "stats.goals" },
                  { th: "A", width: 50, alt: "Assists", val: "stats.assists" },
                  { th: "P", width: 50, alt: "Points", val: "stats.points" },
                ],
                players: buildSeasonData(player, k as LeagueName),
              })}`
              : ""
          )
          .join("\n")}
      </div>
      <div class="sisucup">
        <h2>Sisu Cups Won</h2>
        <p>
          The "Sisu Cup" is awarded to the player who demonstrates the most
          <strong>sisu</strong> <em>(pronounced – see'soo)</em> in a game.
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
              <td class="extra">${notableAbbr(cup.notable, 50)}</td>
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

function activeStats(season: PlayerSeason) {
  return `
    <tr>
      <th>Current ${season.leagueName} Goals</th>
      <td>${season.stats?.goals || "-"}</td>
    </tr>
    <tr>
      <th>Current ${season.leagueName} Assists</th>
      <td>${season.stats?.assists || "-"}</td>
    </tr>
  `
}
