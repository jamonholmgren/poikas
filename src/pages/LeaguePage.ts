import type { Game, PoikasData, Season } from "../types"
import { routePage } from "../route"
import { img } from "../image"

export function LeaguePage(data: PoikasData, slug: string) {
  const league = data.seasons.find((l) => l.url.endsWith(slug))

  if (!league) return new Response(`League not found: ${slug}`, { status: 404 })

  const allSeasons = data.leagues[league.leagueName].seasons

  const {
    url,
    schedule,
    year,
    seasonName,
    leagueName,
    description,
    photos,
    wins,
    losses,
    ties,
    playoffs,
    videos,
    games,
    players,
    sidebar,
  } = league

  const metaImage = (photos && img(photos[0])) || img("finland-flag-icon.png")

  const leagueStandingsHTML = schedule ? `<a href="${schedule}" target="_blank">MVIA</a>` : "-"

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
        <table id="roster" class="roster">
          <thead>
            <tr>
              <th width="50">Photo</th>
              <th>Name</th>
              <th width="30">#</th>
              <th width="30">Pos</th>
              <th width="30">G</th>
              <th width="30">A</th>
              <th width="30">P</th>
              <th width="30" class="extra">Ht</th>
              <th width="30" class="extra">Wt</th>
              <th width="30" class="extra">Sh</th>
              <th width="30" class="extra">Yrs</th>
              <th width="30" class="extra">Age</th>
            </tr>
          </thead>
          <tbody>
            ${
              players &&
              players
                .filter((player) => player.pos !== "G")
                .map((player) => {
                  const seasonStats = player.seasons[leagueName]?.find(
                    (s) => s.year === year && s.seasonName === seasonName
                  )?.stats
                  return `
                    <tr>
                      <td>${player.imageHTML || "-"}</td>
                      <td>${player.profileLink || "-"}</td>
                      <td>${player.number || "-"}</td>
                      <td>${player.pos || "-"}</td>
                      <td>${seasonStats?.goals || "-"}</td>
                      <td>${seasonStats?.assists || "-"}</td>
                      <td>${(seasonStats?.goals || 0) + (seasonStats?.assists || 0) || "-"}</td>
                      <td class="extra">${player.ht || "-"}</td>
                      <td class="extra">${player.wt || "-"}</td>
                      <td class="extra">${player.shoots || "-"}</td>
                      <td class="extra">${player.years || "-"}</td>
                      <td class="extra">${player.age?.() || "-"}</td>
                    </tr>
                  `
                })
                .join("\n")
            }
          </tbody>
        </table>

        <h3>Goalies</h3>
        <table id="goalies" class="roster">
          <thead>
            <tr>
              <th width="50">Photo</th>
              <th>Name</th>
              <th width="30">#</th>
              <th width="30">Pos</th>
              <th width="30">GP</th>
              <th width="30">GAA</th>
              <th width="30">SV%</th>
              <th width="30">SA/G</th>
              <th width="30">SO</th>
              <th width="30" class="extra">Ht</th>
              <th width="30" class="extra">Wt</th>
              <th width="30" class="extra">Sh</th>
              <th width="30" class="extra">Yrs</th>
              <th width="30" class="extra">Age</th>
            </tr>
          </thead>
          <tbody>
            ${
              players &&
              players
                .filter((player) => player.pos === "G")
                .map((player) => {
                  const seasonStats = player.seasons[leagueName]?.find(
                    (s) => s.year === year && s.seasonName === seasonName
                  )?.stats
                  return `
                    <tr>
                      <td>${player.imageHTML || "-"}</td>
                      <td>${player.profileLink || "-"}</td>
                      <td>${player.number || "-"}</td>
                      <td>${player.pos || "-"}</td>
                      <td>${seasonStats?.goalieGamesPlayed || "-"}</td>
                      <td>${seasonStats?.goalsAgainstAverage || "-"}</td>
                      <td>${seasonStats?.savePercentage || "-"}</td>
                      <td>${seasonStats?.averageShotsAgainst || "-"}</td>
                      <td>${seasonStats?.shutouts || "-"}</td>
                      <td class="extra">${player.ht || "-"}</td>
                      <td class="extra">${player.wt || "-"}</td>
                      <td class="extra">${player.shoots || "-"}</td>
                      <td class="extra">${player.years || "-"}</td>
                      <td class="extra">${player.age?.() || "-"}</td>
                    </tr>
                  `
                })
                .join("\n")
            }
          </tbody>
        </table>

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
              <th>Sisu Cup</th>
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
                      <td>${(game.sisu && players?.find((p) => p.name === game.sisu)?.profileLink) || "-"}</td>
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
                      <td><a href="${season.url}" class="${
                  season.year === year && season.seasonName === seasonName ? "current" : ""
                }">${season.year} ${season.seasonName}</a></td>
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
