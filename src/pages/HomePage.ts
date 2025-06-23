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
  let c = data.leagues.C.current || data.leagues.C.seasons.at(-1)!

  // latest games from each league
  const completedRecGames = (rec.games || []).filter((g) => g.result != "pending")
  const lastRecGame = completedRecGames.length > 0 ? completedRecGames.at(-1) : undefined
  const completedCGames = (c.games || []).filter((g) => g.result != "pending")
  const lastCGame = completedCGames.length > 0 ? completedCGames.at(-1) : undefined
  const incompleteRecGames = (rec.games || []).filter((g) => g.result == "pending")
  const nextRecGame = incompleteRecGames.length > 0 ? incompleteRecGames.at(0) : undefined
  const incompleteCGames = (c.games || []).filter((g) => g.result == "pending")
  const nextCGame = incompleteCGames.length > 0 ? incompleteCGames.at(0) : undefined

  return routePage({
    path: "/",
    title: "Suomi Poikas",
    description: "Suomi Poikas Hockey Club",
    metaImage: img("finland-flag-icon.png"),
    sidebar: championLeagues.map((league) => ChampTile({ league })).join("\n"),
    main: `
      <article>
        <img src="${img("poikas-c-2025-spring-champions.jpg")}" alt="Suomi Poikas 2025 Spring CC league championship team photo" class="splash" />
        <h2>Congrats to the 2025 Spring CC League champion Suomi Poikas!</h2>
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
            lastCGame
              ? `<a href="${c.url}" class='game'>
                  <div class='league'>C/CC League</div>
                  <div class='teams'>Poikas vs ${lastCGame.vs} (${lastCGame.date?.toLocaleDateString()})</div>
                  <div class='result'>${lastCGame.result} ${lastCGame.us}-${lastCGame.them}</div>
                  ${lastCGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastCGame.sisu}` || ""}</div>` : ""}
                  <div class='notable'>${lastCGame.notable || ""}</div>
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
            nextCGame
              ? `<a href="${c.url}" class='game'>
                  <div class='league'>C/CC League</div>
                  <div class='teams'>Poikas vs ${nextCGame.vs} (${nextCGame.date?.toLocaleDateString()})</div>
                  <div class='notable'>${nextCGame.notable || ""}</div>
                </a>`
              : "<div class='game'>No C games scheduled</div>"
          }
        </div>

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
          is a Rec League team and a C/CC League team. We play at the
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
          Current C/CC Roster
          <a class="details" href="${c.url}">(view season page)</a>
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
          players: c.players || [],
        })}
      </div>
      <div class="seasons">
        <h2>Season Archives</h2>
        <table id="seasons" class="seasons">
          <thead>
            <tr>
              <th>Season</th>
              <th>Rec League</th>
              <th>C/CC League</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(leagueSeasonsMap(data.seasons))
              .map(
                ([seasonName, leagues]) => `
            <tr>
              <td>${seasonName}</td>
              <td>${leagues.Rec}</td>
              <td>${leagues.C}</td>
            </tr>
          `
              )
              .join("\n")}
          </tbody>
        </table>
      </div>
    `,
  })
}
