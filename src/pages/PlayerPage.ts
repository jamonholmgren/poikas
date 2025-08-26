import type { PoikasData, PoikasImage, PlayerSeason, Player, PlayerStats, LeagueName } from "../types"
import { Champ } from "../components/Champ"
import { sisuCups } from "../utils/sisuCups"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { fullPos, fullShoots, notableAbbr } from "../utils/strings"
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
  const ccSeasons = player.seasons.CC.length || "—"

  const playerImages = images.filter((img: PoikasImage) => img.players.includes(player.name))
  // Also add images from the player's seasons
  const playerSeasonImages = player.seasons.Rec.concat(player.seasons.CC)
    .map((s) => (s.season.photos && s.season.photos.length ? s.season.photos.slice(0, 1) : []))
    .flat()
    .filter((im) => typeof im === "string")
    .map((im: string) => ({
      path: im,
      caption: im,
    }))
  const allImages = [...playerImages, ...playerSeasonImages]

  const rec = player.activeSeasons?.Rec
  const cc = player.activeSeasons?.CC
  const careerGoals = player.careerStats?.goals || 0
  const careerAssists = player.careerStats?.assists || 0

  // Helper function to build season data for a specific league
  function buildSeasonData(player: Player, leagueName: LeagueName | "Career"): SeasonData[] {
    if (leagueName === "Career") {
      let record = `${player.careerStats?.teamWins || 0}-${player.careerStats?.teamLosses || 0}${player.careerStats?.teamTies ? `-${player.careerStats?.teamTies}` : ""}`
      if (player.pos === "G")
        record = `${player.careerStats?.goalieWins || 0}-${player.careerStats?.goalieLosses || 0}${player.careerStats?.goalieTies ? `-${player.careerStats?.goalieTies}` : ""}`
      return [
        {
          seasonLink: "Career",
          record,
          stats: player.careerStats,
          isGoalie: player.pos === "G",
        },
      ]
    }

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
    sidebar: "",
    main: `
      <!-- Hero Section -->
      <div class="player-hero page-hero">
        <div class="page-hero-content">
          <div class="page-hero-image">
            <img
              src="${player.imageURL}"
              alt="${player.name} - Player Photo"
              id="playerimage"
              onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
            />
          </div>
          <div class="page-hero-info">
            <h1 class="page-hero-name">${player.name}</h1>
            <div class="page-hero-details">
              <span class="page-hero-number">#${player.number || "—"}</span>
              <span class="page-hero-position">${fullPos(player.pos)}</span>
            </div>
            <div class="page-hero-description">${player.bio || ""}</div>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="content-section">
        <div class="content-grid">
          <div class="content-card">
            <h3>Player Info</h3>
            <div class="table-container">
              <table class="statsheet">
                <tr>
                  <th>Position</th>
                  <td>${fullPos(player.pos)}</td>
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
                  <td>${fullShoots(player.shoots)}</td>
                </tr>
                <tr>
                  <th>Joined</th>
                  <td>${player.startYear || "-"}</td>
                </tr>
                <tr>
                  <th>Years</th>
                  <td>${player.years || "-"}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="content-card">
            <h3>Career Stats</h3>
            <div class="table-container">
              <table class="statsheet">
                <tr>
                  <th>Career Goals</th>
                  <td>${careerGoals || "-"}</td>
                </tr>
                <tr>
                  <th>Career Assists</th>
                  <td>${careerAssists || "-"}</td>
                </tr>
                <tr>
                  <th>Career Points</th>
                  <td>${careerGoals + careerAssists || "-"}</td>
                </tr>
                <tr>
                  <th>Rec Seasons</th>
                  <td>${recSeasons}</td>
                </tr>
                <tr>
                  <th>CC Seasons</th>
                  <td>${ccSeasons}</td>
                </tr>
                <tr>
                  <th>Championships</th>
                  <td>${Champ(player)}</td>
                </tr>
                ${(rec && activeStats(rec)) || ""}
                ${(cc && activeStats(cc)) || ""}
              </table>
            </div>
          </div>
        </div>
      </div>

      ${
        allImages.length
          ? `
            <div class="media-section">
              <h2>Photos</h2>
              <div id="photos" class="media-grid">
                ${allImages
                  .map(
                    (im) => `
                  <div class="media-item">
                    <a href="${img(im.path)}" target="_blank">
                      <img src="${img(im.path)}" alt="${im.caption}" title="${im.caption}" onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';" />
                      <span class="caption">${im.caption}</span>
                    </a>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
          : ""
      }
      
      <div class="seasons">
        <h2>Season Stats</h2>
        ${Object.keys(player.seasons)
          .concat(["Career"])
          .map((k: string) => {
            if (k !== "Career" && player.seasons[k as LeagueName].length === 0) return ""
            return `
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
                        { th: "GAA", width: 50, alt: "Goals against average", val: "stats.goalsAgainstAverageFormatted" },
                        { th: "SV%", width: 50, alt: "Save percentage", val: "stats.savePercentageFormatted" },
                        { th: "SA/G", width: 50, alt: "Shots against per game", val: "stats.averageShotsAgainstFormatted" },
                        { th: "SO", width: 50, alt: "Shutouts", val: "stats.shutouts" },
                      ]
                    : []),
                  { th: "G", width: 50, alt: "Goals", val: "stats.goals" },
                  { th: "A", width: 50, alt: "Assists", val: "stats.assists" },
                  { th: "P", width: 50, alt: "Points", val: "stats.points" },
                ],
                players: buildSeasonData(player, k as LeagueName),
              })}`
          })
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
        <div class="table-container">
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
              <td class="extra">${notableAbbr(cup.notable, 20)}</td>
            </tr>
                `
              )
              .join("")}

          </tbody>
        </table>
        </div>
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
