import type { PoikasData } from "../types"
import { routePage } from "../route"
import { ChampTile } from "../components/ChampTile"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"
import { serverStart } from "../server"
import { notableAbbr } from "../utils/strings"

export function HomePage(data: PoikasData) {
  // Finding the championships we've won as a team, but
  // ignoring the "with Russia" or "with Ukraine" leagues
  const championLeagues = data.seasons.filter((s) => s.playoffs === "champions" && !`${s.aside}`.includes("with")).toReversed()

  let rec = data.leagues.Rec.current || data.leagues.Rec.seasons.at(-1)!
  let cc = data.leagues.CC.current || data.leagues.CC.seasons.at(-1)!

  // latest games from each league
  const completedRecGames = (rec.games || []).filter((g) => g.result != "pending")
  const lastRecGame = completedRecGames.length > 0 ? completedRecGames.at(-1) : undefined
  const completedCCGames = (cc.games || []).filter((g) => g.result != "pending")
  const lastCCGame = completedCCGames.length > 0 ? completedCCGames.at(-1) : undefined
  const incompleteRecGames = (rec.games || []).filter((g) => g.result == "pending")
  const nextRecGame = incompleteRecGames.length > 0 ? incompleteRecGames.at(0) : undefined
  const incompleteCCGames = (cc.games || []).filter((g) => g.result == "pending")
  const nextCCGame = incompleteCCGames.length > 0 ? incompleteCCGames.at(0) : undefined

  return routePage({
    path: "/",
    title: "Suomi Poikas",
    description: "Suomi Poikas Hockey Club",
    metaImage: img("finland-flag-icon.png"),
    sidebar: championLeagues.map((league) => ChampTile({ league })).join("\n"),
    main: `
      <!-- Hero Section -->
      <div class="page-hero">
        <div class="page-hero-content">
          <div class="page-hero-image">
            <img
              src="${img("poikas-c-2025-spring-champions.jpg")}?c=${serverStart}"
              alt="Suomi Poikas 2025 Spring CC league championship team photo"
              onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
            />
          </div>
          <div class="page-hero-info">
            <h1 class="page-hero-name">Champs!</h1>
            <div class="page-hero-details">
              <div class="stat-item">
                <span class="stat-number">🏆</span>
                <span class="stat-label">2025 Spring CC Champions</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">🇫🇮</span>
                <span class="stat-label">Finnish-American Team</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">2</span>
                <span class="stat-label">Active Leagues</span>
              </div>
            </div>
            <div class="page-hero-description">
              <p>Welcome to the official website of the Suomi Poikas, your favorite Finnish-American hockey team! Hyvä Suomi! 🇫🇮</p>
              <p><strong>Fall season starts September 6th!</strong> Our Rec and CC teams are starting soon.</p>
              <p>This year, our championship-winning CC team was promoted to the new CC league!</p>
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
                      <span class="mini-stat-number">${rec.wins && rec.losses ? ((rec.wins / (rec.wins + rec.losses + (rec.ties || 0))) * 100).toFixed(1) : "0.0"}%</span>
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
                    <div class='result'>${lastRecGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${lastRecGame.result} ${lastRecGame.us}-${
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
                      <div class='teams'>Poikas vs ${nextRecGame.vs}<br />${nextRecGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div class='notable'>${nextRecGame.notable || ""}</div>
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
                      <span class="mini-stat-number">${cc.wins && cc.losses ? ((cc.wins / (cc.wins + cc.losses + (cc.ties || 0))) * 100).toFixed(1) : "0.0"}%</span>
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
                    <div class='teams'>Poikas vs ${lastCCGame.vs}<br />${lastCCGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
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
                      <div class='teams'>Poikas vs ${nextCCGame.vs}<br />${nextCCGame.date?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div class='notable'>${nextCCGame.notable || ""}</div>
                    </a>`
                  : "<div class='game'>No CC games scheduled</div>"
              }
            </div>
          </div>
        </div>
      </div>

      <article>
        <h2>What's New?</h2>
        <p><em>Updated August 28, 2025</em></p>
        <ul>
          <li>New website design refresh!</li>
          <li>Fixed a bunch of layout issues from the last design</li>
          <li>Updated a bunch of players' bios</li>
        </ul>

        <h2>Our History</h2>
        <p>
          In fall of 2018, <a href="/players/brenden-mattila">Brenden Mattila</a>
          turned 18 and started playing ice hockey with the local Thundersticks
          Rec League team. While watching him play, his dad
          <a href="/players/joel-mattila">Joel Mattila</a>
          decided to join for spring 2019 league, along with his friend Eric Matson.
          Halfway through the season, Joel thought "I know enough Finns who play hockey
          that I could start a team," and the Suomi Poikas ("Finnish Boys") were born.
        </p>
        <p>
          The club is made up primarily of Finnish-American players. Most seasons, there
          is a Rec League team and a CC League team. We play at the
          <a href="https://mtviewice.com/" target="_blank">Mountain View Ice Arena</a>
          in Vancouver, Washington, USA.
        </p>
        <p>
          If you're interested in joining the team,
          <a href="/join/">click here</a>.
        </p>
        <h2>Connect with Us</h2>
        <p>
          Follow us on
          <a href="https://www.facebook.com/profile.php?id=100069293784030" target="_blank">Facebook</a>!
        </p>
        <p>
          Also check out our recent
          <a href="https://www.youtube.com/watch?v=y-PfIM5V3_Q" target="_blank">Fall 2023 Rec championship video</a>.
        </p>
        <p>Subscribe to our Rec & CC schedules:</p>
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
      </article>

      <div class="roster">
        <h2>
          Current Rec Roster
          <a class="details" href="${rec.url}">(view season page)</a>
        </h2>
        ${renderRosterTable({
          id: "rec-roster",
          className: "roster",
          columns: [
            { th: "Photo", val: "imageHTML", width: 50, alt: "Player photo" },
            { th: "Name", val: "profileLink", alt: "Player name" },
            { th: "#", val: "number", width: 30, alt: "Jersey number" },
            { th: "Pos", val: "pos", width: 30, alt: "Position" },
            { th: "Ht", val: "ht", width: 30, xtra: true, alt: "Height" },
            { th: "Wt", val: "wt", width: 30, xtra: true, alt: "Weight" },
            { th: "Sh", val: "shoots", width: 30, xtra: true, alt: "Shoots left or right" },
            { th: "Yrs", val: "years", width: 30, xtra: true, alt: "Years with team" },
            { th: "Age", val: "age", width: 30, xtra: true, alt: "Player age" },
          ],
          players: rec.players || [],
        })}

        <h2>
          Current CC Roster
          <a class="details" href="${cc.url}">(view season page)</a>
        </h2>
        ${renderRosterTable({
          id: "c-roster",
          className: "roster",
          columns: [
            { th: "Photo", val: "imageHTML", width: 50, alt: "Player photo" },
            { th: "Name", val: "profileLink", alt: "Player name" },
            { th: "#", val: "number", width: 30, alt: "Jersey number" },
            { th: "Pos", val: "pos", width: 30, alt: "Position" },
            { th: "Ht", val: "ht", width: 30, xtra: true, alt: "Height" },
            { th: "Wt", val: "wt", width: 30, xtra: true, alt: "Weight" },
            { th: "Sh", val: "shoots", width: 30, xtra: true, alt: "Shoots left or right" },
            { th: "Yrs", val: "years", width: 30, xtra: true, alt: "Years with team" },
            { th: "Age", val: "age", width: 30, xtra: true, alt: "Player age" },
          ],
          players: cc.players || [],
        })}
      </div>
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
