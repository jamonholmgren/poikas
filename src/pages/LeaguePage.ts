import type { Game, Player, PlayerStats, PoikasData, Season } from "../types"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"
import { fullPlayoffs, fullRecord, notableAbbr, shortenName } from "../utils/strings"

export function LeaguePage(data: PoikasData, slug: string) {
  const league = data.seasons.find((l) => l.url.endsWith(slug))
  if (!league) return new Response(`League not found: ${slug}`, { status: 404 })

  const allSeasons = data.leagues[league.leagueName].seasons
  const { url, schedule, year, seasonName, leagueName, description, photos, wins, losses, ties, playoffs, videos, games, players, sidebar } = league
  const metaImage = (photos && img(photos[0])) || img("finland-flag-icon.png")
  const leagueStandingsHTML = schedule ? `<a href="${schedule}" target="_blank">MVIA</a>` : "-"

  const getValueCustom = (prop: keyof PlayerStats) => (player: Player) => {
    const seasonStats = player.seasons[leagueName]?.find((s) => s.year === year && s.seasonName === seasonName)?.stats
    const s = seasonStats && seasonStats[prop]
    if (s === undefined || s === null) return "-"
    if (typeof s === "string") return s || "-"
    if (typeof s === "number" && isNaN(s)) return "-"
    return s
  }

  const getAgeCustom = (season: Season) => (player: Player) => {
    if (!player.born) return "-"
    return player.age(season.year) || "-"
  }

  const record = `${wins || 0}-${losses || 0}${ties ? `-${ties}` : ""}`
  const winPercentage = wins && losses ? ((wins / (wins + losses + (ties || 0))) * 100).toFixed(1) : "0.0"

  return routePage({
    path: url,
    title: `${year} ${seasonName} ${leagueName}`,
    description: `Suomi Poikas league ${year} ${seasonName} ${leagueName}`,
    metaImage,
    sidebar: ``,
    main: `
      <!-- Hero Section -->
      <div class="league-hero page-hero">
        <div class="page-hero-content">
          <div class="page-hero-image">
            <a href="${metaImage}" target="_blank">
              <img
                src="${metaImage}"
                alt="${year} ${seasonName} ${leagueName} - League Photo"
                onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
              />
            </a>
          </div>
          <div class="page-hero-info">
            <h1 class="page-hero-name">${year} ${seasonName} ${leagueName}</h1>
            <div class="page-hero-details">
              <div class="stat-item">
                <span class="stat-number">${record}</span>
                <span class="stat-label">Record</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${winPercentage}%</span>
                <span class="stat-label">Win %</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${players?.length || 0}</span>
                <span class="stat-label">Players</span>
              </div>
            </div>
            <div class="page-hero-description">${description || ""}</div>
          </div>
        </div>
      </div>

      <!-- Season Info Section -->
      <div class="content-section">
        <div class="content-grid">
          <div class="content-card">
            <h3>Season Results</h3>
            <div class="table-container">
              <table class="statsheet">
                <tr>
                  <th>Standings/Schedule</th>
                  <td>${leagueStandingsHTML || "-"}</td>
                </tr>
                <tr>
                  <th>Wins</th>
                  <td>${wins || "0"}</td>
                </tr>
                <tr>
                  <th>Losses</th>
                  <td>${losses || "0"}</td>
                </tr>
                <tr>
                  <th>Ties/OT Losses</th>
                  <td>${ties || "0"}</td>
                </tr>
                <tr>
                  <th>Playoffs Result</th>
                  <td>${playoffs || "-"}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="content-card">
            <h3>Team Schedule</h3>
            <p>Subscribe to our ${leagueName} schedule:</p>
            <ul class="schedule-links">
              <li>
                <a href="webcal://ics.benchapp.com/eyJwbGF5ZXJJZCI6NDY1ODAzLCJ0ZWFtSWQiOlsyNDYyNDBdfQ" target="_blank">
                  📅 Webcal: Apple Calendar, Google Calendar
                </a>
              </li>
              <li>
                <a href="https://ics.benchapp.com/eyJwbGF5ZXJJZCI6NDY1ODAzLCJ0ZWFtSWQiOlsyNDYyNDBdfQ==" target="_blank">
                  📄 ICS file: Outlook, iCal, etc.
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Videos Section -->
      ${
        videos && videos.length
          ? `
            <div class="videos-section">
              <h2>Videos</h2>
              <div class="videos">
                ${videos
                  .map(
                    (video) => `
                  <iframe
                    src="${video}"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                  ></iframe>
                `
                  )
                  .join("\n")}
              </div>
            </div>
          `
          : ""
      }

      <!-- Roster Section -->
      <div class="roster-section">
        <h2>Roster</h2>
        ${renderRosterTable({
          id: "roster",
          className: "roster",
          columns: [
            { th: "Photo", val: "imageHTML", width: 50, alt: "Player photo" },
            { th: "Name", val: "profileLink", alt: "Player name" },
            { th: "#", val: "number", width: 30, alt: "Jersey number" },
            { th: "Pos", val: "pos", width: 30, alt: "Position" },
            { th: "G", getValue: getValueCustom("goals"), width: 30, alt: "Goals" },
            { th: "A", getValue: getValueCustom("assists"), width: 30, alt: "Assists" },
            { th: "P", getValue: getValueCustom("points"), width: 30, xtra: true, alt: "Points" },
            { th: "Ht", val: "ht", width: 30, xtra: true, alt: "Height" },
            { th: "Wt", val: "wt", width: 30, xtra: true, alt: "Weight" },
            { th: "Sh", val: "shoots", width: 30, xtra: true, alt: "Shoots left or right" },
            { th: "Yrs", val: "years", width: 30, xtra: true, alt: "Years with team" },
            { th: "Age", getValue: getAgeCustom(league), width: 30, xtra: true, alt: "Player age" },
          ],
          players: players?.filter((player) => player.pos !== "G") || [],
        })}

        <h3>Goalies</h3>
        ${renderRosterTable({
          id: "goalies",
          className: "roster",
          columns: [
            { th: "Photo", val: "imageHTML", width: 50, alt: "Player photo" },
            { th: "Name", val: "profileLink", alt: "Player name" },
            { th: "#", val: "number", width: 30, alt: "Jersey number" },
            { th: "Pos", val: "pos", width: 30, alt: "Position" },
            { th: "GP", width: 30, alt: "Games played as goalie", getValue: getValueCustom("goalieGamesPlayed") },
            { th: "WLT", width: 30, alt: "WLT", getValue: getValueCustom("goalieRecord") },
            { th: "GAA", width: 30, alt: "Goals against average", getValue: getValueCustom("goalsAgainstAverageFormatted") },
            { th: "SV%", width: 30, alt: "Save percentage", getValue: getValueCustom("savePercentageFormatted") },
            { th: "SA/G", width: 30, alt: "Shots against per game", getValue: getValueCustom("averageShotsAgainstFormatted") },
            { th: "SO", width: 30, alt: "Shutouts", getValue: getValueCustom("shutouts") },
            { th: "Ht", val: "ht", width: 30, xtra: true, alt: "Height" },
            { th: "Wt", val: "wt", width: 30, xtra: true, alt: "Weight" },
            { th: "Sh", val: "shoots", width: 30, xtra: true, alt: "Shoots left or right" },
            { th: "Yrs", val: "years", width: 30, xtra: true, alt: "Years with team" },
            { th: "Age", getValue: getAgeCustom(league), width: 30, xtra: true, alt: "Player age" },
          ],
          players: players?.filter((player) => player.pos === "G") || [],
        })}
      </div>

      <!-- Games Section -->
      <div class="games-section">
        <h2>Games</h2>
        <div class="table-container">
          <table id="games" class="roster">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Score</th>
                <th>Shots</th>
                <th>Sisu Cup</th>
                <th>Goalie</th>
                <th class="extra">Notable</th>
              </tr>
            </thead>
            <tbody>
              ${
                games
                  ? games
                      .map(
                        (game) => `
                      <tr>
                        <td>${game.date ? game.date.toLocaleDateString() : "-"}</td>
                        <td>${game.vsLink}</td>
                        <td>${gameScore(game)}</td>
                        <td>${gameShots(game)}</td>
                        <td>${(game.sisu && players?.find((p) => p.name === game.sisu)?.shortProfileLink) || "-"}</td>
                        <td>${game.goaliePlayer?.shortProfileLink || shortenName(game.goalie)}</td>
                        <td class="extra notable">${notableAbbr(game.notable, 60)}</td>
                      </tr>
                    `
                      )
                      .join("\n")
                  : "<td colspan='6'>No game data available for this season</td>"
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Previous Seasons Section -->
      <div class="previous-seasons-section">
        <h2>Previous Seasons</h2>
        <div class="table-container">
          <table id="previous-seasons" class="roster">
            <thead>
              <tr>
                <th>Season</th>
                <th>Record</th>
                <th>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              ${allSeasons
                .map(
                  (season) => `
                      <tr>
                        <td><a href="${season.url}" class="${season.year === year && season.seasonName === seasonName ? "current" : ""}">${season.year} ${
                    season.seasonName
                  }</a></td>
                        <td>${fullRecord(season.wins, season.losses, season.ties)}</td>
                        <td>${fullPlayoffs(season.playoffs) || "-"}</td>
                      </tr>
                    `
                )
                .join("\n")}
            </tbody>
          </table>
        </div>
      </div>
    `,
  })
}

function gameScore(game: Game) {
  if (game.result === "pending") return "Upcoming"
  if (game.result === "forfeited") return "Forfeited"
  if (game.result === "cancelled") return "Cancelled"
  if (game.us !== undefined && game.them !== undefined) return `${game.result} ${game.us}-${game.them}`
  return game.result
}

function gameShots(game: Game) {
  if (game.shotsUs === undefined || game.shotsThem === undefined) return "-"
  return `${game.shotsUs}-${game.shotsThem}`
}
