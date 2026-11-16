import type { Game, PoikasData } from "../types"
import { routePage } from "../route"
import { ChampTile } from "../components/ChampTile"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { img } from "../image"
import { opponentRecord, pointsLeaderboard, renderPointsLeaderboard, seasonHeading } from "../utils/homepage"
import { serverStart } from "../server"

export function HomePage(data: PoikasData) {
  // Finding the championships we've won as a team, but
  // ignoring the "with Russia" or "with Ukraine" leagues
  const championLeagues = data.seasons.filter((s) => s.playoffs === "champions" && !`${s.aside}`.includes("with")).toReversed()

  let rec = data.leagues.Rec.current || data.leagues.Rec.seasons.at(-1)!
  let cc = data.leagues.CC.current || data.leagues.CC.seasons.at(-1)!

  // latest games from each league
  const completedRecGames = (rec.games || []).filter((g) => g.result && !["pending", "cancelled"].includes(g.result))
  const lastRecGame = completedRecGames.length > 0 ? completedRecGames.at(-1) : undefined
  const completedCCGames = (cc.games || []).filter((g) => g.result && !["pending", "cancelled"].includes(g.result))
  const lastCCGame = completedCCGames.length > 0 ? completedCCGames.at(-1) : undefined
  const incompleteRecGames = upcomingPendingGames(rec.games || [])
  const nextRecGame = incompleteRecGames.length > 0 ? incompleteRecGames.at(0) : undefined
  const incompleteCCGames = upcomingPendingGames(cc.games || [])
  const nextCCGame = incompleteCCGames.length > 0 ? incompleteCCGames.at(0) : undefined
  const percentage = (wins: number | undefined, losses: number | undefined, ties: number | undefined) => {
    const gamesPlayed = (wins || 0) + (losses || 0) + (ties || 0)
    return gamesPlayed ? (((wins || 0) / gamesPlayed) * 100).toFixed(1) : "0.0"
  }

  return routePage({
    path: "/",
    title: "Suomi Poikas",
    description: "Suomi Poikas Hockey Club",
    metaImage: img("finland-flag-icon.png"),
    sidebar: championLeagues.map((league) => ChampTile({ league })).join("\n"),
    main: `
      <!-- Hero Section -->
      <div class="page-hero home-hero">
        <div class="page-hero-content">
          <figure class="page-hero-image championship-photo">
            <img
              src="${img("poikas-rec-and-cc-2025-fall-double-championship.jpg")}?c=${serverStart}"
              alt="Suomi Poikas Rec and CC teams celebrating their Fall 2025 championships"
              onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
            />
            <figcaption>Two teams, two trophies: celebrating our Fall 2025 double championship.</figcaption>
          </figure>
          <div class="page-hero-info">
            <h1 class="page-hero-name">${seasonHeading(rec)}</h1>
            <div class="page-hero-details">
              <div class="stat-item">
                <span class="stat-number">🏒</span>
                <span class="stat-label">${rec.seasonName} ${rec.year}</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" aria-label="Two championship trophies">🏆🏆</span>
                <span class="stat-label">Fall 2025: Double Champs</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">🇫🇮</span>
                <span class="stat-label">Finnish-American Team</span>
              </div>
            </div>
            <div class="page-hero-description">
              <p>Welcome to the official website of the Suomi Poikas, your favorite Finnish-American hockey team! Hyvä Suomi! 🇫🇮</p>
              <p><strong>Follow our Rec and CC teams at Mountain View Ice Arena.</strong> Our <a href="${rec.url}">${rec.seasonName} ${rec.year} Rec team</a> is ${rec.wins || 0}-${rec.losses || 0}-${rec.ties || 0}, and our <a href="${cc.url}">${cc.seasonName} ${cc.year} CC team</a> is ${cc.wins || 0}-${cc.losses || 0}-${cc.ties || 0}. Catch up on the latest results and upcoming games below.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Latest Games Section -->
      <div class="content-section">
        <div class="content-grid">
          <div class="content-card">
            <div class="mini-hero">
              <div class="mini-hero-content">
                <div class="mini-hero-image">
                  <img
                    src="${rec.photos && rec.photos[0] ? img(rec.photos[0]) : img("000-placeholder.jpg")}"
                    alt="${rec.year} ${rec.seasonName} Rec League"
                    onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
                  />
                </div>
                <div class="mini-hero-info">
                  <h3>${rec.year} ${rec.seasonName} Rec</h3>
                  <div class="mini-hero-stats">
                    <div class="mini-stat">
                      <span class="mini-stat-number">${rec.wins || 0}-${rec.losses || 0}${rec.ties ? `-${rec.ties}` : ""}</span>
                      <span class="mini-stat-label">Record</span>
                    </div>
                    <div class="mini-stat">
                      <span class="mini-stat-number">${percentage(rec.wins, rec.losses, rec.ties)}%</span>
                      <span class="mini-stat-label">Win %</span>
                    </div>
                    <div class="mini-stat">
                      <span class="mini-stat-number">${rec.players?.length || 0}</span>
                      <span class="mini-stat-label">Players</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="latest-games">
            ${
              lastRecGame
                ? `<a href="${rec.url}" class='game'>
                    <div class='league'>Latest Game</div>
                    <div class='teams'>Poikas vs ${lastRecGame.vs}</div>
                    <div class='result'>${lastRecGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${lastRecGame.result} ${lastRecGame.us}-${
                      lastRecGame.them
                    }</div>
                    ${lastRecGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastRecGame.sisu}` || ""}</div>` : ""}
                    <div class='notable'>${lastRecGame.notable || ""}</div>
                  </a>`
                : "<div class='game'>No games completed yet</div>"
            }
              ${
                nextRecGame
                  ? `<a href="${rec.url}" class='game'>
                      <div class='league'>Next Game</div>
                      <div class='teams'>Poikas vs ${nextRecGame.vs}<br />${nextRecGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
                      <div class='notable'>${nextRecGame.notable || ""}</div>
                      <p class="matchup-record">${opponentRecord(rec, nextRecGame)}</p>
                    </a>`
                  : "<div class='game'>No Rec games scheduled</div>"
              }
            </div>
          </div>

          <div class="content-card">
            <div class="mini-hero">
              <div class="mini-hero-content">
                <div class="mini-hero-image">
                  <img
                    src="${cc.photos && cc.photos[0] ? img(cc.photos[0]) : img("000-placeholder.jpg")}"
                    alt="${cc.year} ${cc.seasonName} CC League"
                    onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
                  />
                </div>
                <div class="mini-hero-info">
                  <h3>${cc.year} ${cc.seasonName} CC</h3>
                  <div class="mini-hero-stats">
                    <div class="mini-stat">
                      <span class="mini-stat-number">${cc.wins || 0}-${cc.losses || 0}${cc.ties ? `-${cc.ties}` : ""}</span>
                      <span class="mini-stat-label">Record</span>
                    </div>
                    <div class="mini-stat">
                      <span class="mini-stat-number">${percentage(cc.wins, cc.losses, cc.ties)}%</span>
                      <span class="mini-stat-label">Win %</span>
                    </div>
                    <div class="mini-stat">
                      <span class="mini-stat-number">${cc.players?.length || 0}</span>
                      <span class="mini-stat-label">Players</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="latest-games">
            ${
              lastCCGame
                ? `<a href="${cc.url}" class='game'>
                    <div class='league'>Latest Game</div>
                    <div class='teams'>Poikas vs ${lastCCGame.vs}<br />${lastCCGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
                    <div class='result'>${lastCCGame.result} ${lastCCGame.us}-${lastCCGame.them}</div>
                    ${lastCCGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastCCGame.sisu}` || ""}</div>` : ""}
                    <div class='notable'>${lastCCGame.notable || ""}</div>
                  </a>`
                : "<div class='game'>No games completed yet</div>"
            }
              ${
                nextCCGame
                  ? `<a href="${cc.url}" class='game'>
                      <div class='league'>Next Game</div>
                      <div class='teams'>Poikas vs ${nextCCGame.vs}<br />${nextCCGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
                      <div class='notable'>${nextCCGame.notable || ""}</div>
                      <p class="matchup-record">${opponentRecord(cc, nextCCGame)}</p>
                    </a>`
                  : "<div class='game'>No CC games scheduled</div>"
              }
            </div>
          </div>
        </div>
      </div>

      <article>
        <h2>What's New?</h2>
        <ul>
          ${lastRecGame ? `<li><a href="${rec.url}">Rec latest:</a> ${lastRecGame.date?.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }) || "Latest game"} — ${lastRecGame.result} ${lastRecGame.us}-${lastRecGame.them} vs ${lastRecGame.vs}.</li>` : ""}
          ${lastCCGame ? `<li><a href="${cc.url}">CC latest:</a> ${lastCCGame.date?.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }) || "Latest game"} — ${lastCCGame.result} ${lastCCGame.us}-${lastCCGame.them} vs ${lastCCGame.vs}.</li>` : ""}
          <li>Fall 2025: both Rec and CC teams won the championship.</li>
        </ul>

      </article>

      <section class="points-leaderboards" aria-label="Points leaderboards">
        ${renderPointsLeaderboard(pointsLeaderboard(data, rec), "Rec")}
        ${renderPointsLeaderboard(pointsLeaderboard(data, cc), "CC")}
      </section>
      <div class="seasons">
        <h2>Season Archives</h2>
        <div class="table-container">
          <table id="seasons" class="seasons">
            <thead>
              <tr>
                <th>Season</th>
                <th>Rec League</th>
                <th>CC League</th>
              </tr>
            </thead>
            <tbody>
            ${Object.entries(leagueSeasonsMap(data.seasons))
              .map(
                ([seasonName, leagues]) => `
            <tr>
              <td>${seasonName}</td>
              <td>${leagues.Rec}</td>
              <td>${leagues.CC}</td>
            </tr>
          `,
              )
              .join("\n")}
          </tbody>
        </table>
        </div>
      </div>
    `,
  })
}

export function upcomingPendingGames(games: Game[], now = new Date()) {
  const today = localDateKey(now)
  return games.filter((g) => g.result == "pending" && (!g.date || gameDateKey(g.date) >= today))
}

function gameDateKey(date: Date) {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()
}

function localDateKey(date: Date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}
