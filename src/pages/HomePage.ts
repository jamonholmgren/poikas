import type { PoikasData } from "../types"
import { routePage } from "../route"
import { ChampTile } from "../components/ChampTile"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

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
      <article>
        <h2>Fall season starts September 6th!</h2>
        <p>
          Fall season for our Rec and CC teams are starting on September 6th! Keep an eye on our website for more info.
          This year, our CC team was promoted to the new CC league. We have a Rec team as usual. We don't have a C team
          yet (due to lack of team slots available).
        </p>
        <h2>Congrats to the 2025 Spring CC League champion Suomi Poikas!</h2>
        <img src="${img("poikas-c-2025-spring-champions.jpg")}?c=2" alt="Suomi Poikas 2025 Spring CC league championship team photo" class="splash" />
        <p>
          Welcome to the official website of the Suomi Poikas, your favorite Finnish-American hockey team! Hyvä Suomi!
          🇫🇮
        </p>

        <h2>Latest Games</h2>
        <div class='latest-games'>
        ${
          lastRecGame
            ? `<a href="${rec.url}" class='game'>
                <div class='league'>Rec League</div>
                <div class='teams'>Poikas vs ${lastRecGame.vs} (${lastRecGame.date?.toLocaleDateString()})</div>
                <div class='result'>${lastRecGame.result} ${lastRecGame.us}-${lastRecGame.them}</div>
                ${lastRecGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastRecGame.sisu}` || ""}</div>` : ""}
                <div class='notable'>${lastRecGame.notable || ""}</div>
              </a>`
            : "<div class='game'>No games completed yet</div>"
        }
          ${
            lastCCGame
              ? `<a href="${cc.url}" class='game'>
                  <div class='league'>CC League</div>
                  <div class='teams'>Poikas vs ${lastCCGame.vs} (${lastCCGame.date?.toLocaleDateString()})</div>
                  <div class='result'>${lastCCGame.result} ${lastCCGame.us}-${lastCCGame.them}</div>
                  ${lastCCGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastCCGame.sisu}` || ""}</div>` : ""}
                  <div class='notable'>${lastCCGame.notable || ""}</div>
                </a>`
              : "<div class='game'>No games completed yet</div>"
          }
        </div>
        <h2>Next Games</h2>
        <div class='latest-games'>
        ${
          nextRecGame
            ? `<a href="${rec.url}" class='game'>
                <div class='league'>Rec League</div>
                <div class='teams'>Poikas vs ${nextRecGame.vs} (${nextRecGame.date?.toLocaleDateString()})</div>
                <div class='notable'>${nextRecGame.notable || ""}</div>
              </a>`
            : "<div class='game'>No Rec games scheduled</div>"
        }
          ${
            nextCCGame
              ? `<a href="${cc.url}" class='game'>
                  <div class='league'>CC League</div>
                  <div class='teams'>Poikas vs ${nextCCGame.vs} (${nextCCGame.date?.toLocaleDateString()})</div>
                  <div class='notable'>${nextCCGame.notable || ""}</div>
                </a>`
              : "<div class='game'>No CC games scheduled</div>"
          }
        </div>

        <h2>What's New?</h2>
        <p><em>Updated June 23, 2025</em></p>
        <ul>
          <li>Updated with the final stats and info from the 2025 spring leagues</li>
          <li>Updated a bunch of players</li>
          <li>Added sortable stats tables to each season page</li>
          <li>Added sortable stats tables to each player page</li>
          <li>Lots more stats everywhere ... go check them out!</li>
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
