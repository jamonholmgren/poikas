import type { Game, Player, PlayerStats, PoikasData, Season } from "../types"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

export function LeaguePage(data: PoikasData, slug: string) {
  const league = data.seasons.find((l) => l.url.endsWith(slug))
  if (!league) return new Response(`League not found: ${slug}`, { status: 404 })

  const allSeasons = data.leagues[league.leagueName].seasons
  const { url, schedule, year, seasonName, leagueName, description, photos, wins, losses, ties, playoffs, videos, games, players, sidebar } = league
  const metaImage = (photos && img(photos[0])) || img("finland-flag-icon.png")
  const leagueStandingsHTML = schedule ? `<a href="${schedule}" target="_blank">MVIA</a>` : "-"

  const getValueCustom = (prop: keyof PlayerStats) => (player: Player) => {
    const seasonStats = player.seasons[leagueName]?.find((s) => s.year === year && s.seasonName === seasonName)?.stats
    return (seasonStats && seasonStats[prop]) || "-"
  }

  return routePage({
    path: url,
    title: `${year} ${seasonName} ${leagueName}`,
    description: `Suomi Poikas league ${year} ${seasonName} ${leagueName}`,
    metaImage,
    sidebar: `
      <a href="${metaImage}" target="_blank">
        <img
          src="${metaImage}"
          alt="${year} ${seasonName} ${leagueName} - League Photo"
          id="leagueimage"
          onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
        />
        <span class="caption" id="leagueimagecaption">${year} ${seasonName} ${leagueName}</span>
      </a>
      ${sidebar || ""}
    `,
    main: `
      <article>
        <h2 id="seasonname">${year} ${seasonName} ${leagueName}</h2>
        <p id="description">${description || ""}</p>
        <table id="seasonresults" class="statsheet">
          <tr>
            <th>Standings/Schedule/Stats</th>
            <td>${leagueStandingsHTML || ""}</td>
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
            <td>${playoffs || ""}</td>
          </tr>
        </table>

        <div id="videos" class="videos">
          ${
            (videos &&
              videos
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
                .join("\n")) ||
            ""
          }
        </div>

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
            { th: "Age", val: "age", width: 30, xtra: true, alt: "Player age" },
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
            { th: "GAA", width: 30, alt: "Goals against average", getValue: getValueCustom("goalsAgainstAverage") },
            { th: "SV%", width: 30, alt: "Save percentage", getValue: getValueCustom("savePercentage") },
            { th: "SA/G", width: 30, alt: "Shots against per game", getValue: getValueCustom("averageShotsAgainst") },
            { th: "SO", width: 30, alt: "Shutouts", getValue: getValueCustom("shutouts") },
            { th: "Ht", val: "ht", width: 30, xtra: true, alt: "Height" },
            { th: "Wt", val: "wt", width: 30, xtra: true, alt: "Weight" },
            { th: "Sh", val: "shoots", width: 30, xtra: true, alt: "Shoots left or right" },
            { th: "Yrs", val: "years", width: 30, xtra: true, alt: "Years with team" },
            { th: "Age", val: "age", width: 30, xtra: true, alt: "Player age" },
          ],
          players: players?.filter((player) => player.pos === "G") || [],
        })}

        <h2>Games</h2>

        <p>Subscribe to our Rec & C/CC schedules:</p>
        <ul>
          <li>
            <a href="webcal://ics.benchapp.com/eyJwbGF5ZXJJZCI6NDY1ODAzLCJ0ZWFtSWQiOlsyNDYyNDBdfQ"
              >Webcal link: Apple Calendar, Google Calendar</a
            >
          </li>
          <li>
            <a href="https://ics.benchapp.com/eyJwbGF5ZXJJZCI6NDY1ODAzLCJ0ZWFtSWQiOlsyNDYyNDBdfQ==" target="_blank"
              >ICS file: Outlook, iCal, etc.</a
            >
          </li>
        </ul>

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
              games &&
              games
                .map(
                  (game) => `
                    <tr>
                      <td>${game.date ? game.date.toLocaleDateString() : "-"}</td>
                      <td>${game.vsLink}</td>
                      <td>${gameScore(game)}</td>
                      <td>${gameShots(game)}</td>
                      <td>${(game.sisu && players?.find((p) => p.name === game.sisu)?.shortProfileLink) || "-"}</td>
                      <td>${game.goaliePlayer?.shortProfileLink || game.goalie || "-"}</td>
                      <td class="extra notable">${game.notable || "-"}</td>
                    </tr>
                  `
                )
                .join("\n")
            }
          </tbody>
        </table>

        <h2>Previous Seasons</h2>
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
                      <td><a href="${season.url}" class="${season.year === year && season.seasonName === seasonName ? "current" : ""}">${season.year} ${season.seasonName}</a></td>
                      <td>${season.wins || 0}-${season.losses || 0}${season.ties ? `-${season.ties}` : ""}</td>
                      <td>${season.playoffs || "-"}</td>
                    </tr>
                  `
              )
              .join("\n")}
          </tbody>
        </table>
      </article>
    `,
  })
}

function gameScore(game: Game) {
  if (game.result === "pending") return "Upcoming"
  if (game.result === "forfeited") return "Forfeited"
  if (game.result === "cancelled") return "Cancelled"
  return `${game.result} ${game.us}-${game.them}`
}

function gameShots(game: Game) {
  if (game.shotsUs === undefined || game.shotsThem === undefined) return "-"
  return `${game.shotsUs}-${game.shotsThem}`
}
