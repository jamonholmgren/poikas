import type { PoikasData } from "../types"
import { routePage } from "../route"
import { ChampTile } from "../components/ChampTile"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"

export function HomePage(data: PoikasData) {
  // Finding the championships we've won as a team, but
  // ignoring the "with Russia" or "with Ukraine" leagues
  const championLeagues = data.leagues
    .filter((s) => s.playoffs === "champions" && !`${s.aside}`.includes("with"))
    .toReversed()

  let recLeague = data.leagues.find((l) => l.level === "Rec" && l.current)
  if (!recLeague) recLeague = data.leagues.filter((l) => l.level === "Rec").pop()!
  let cLeague = data.leagues.find((l) => l.level === "C" && l.current)
  if (!cLeague) cLeague = data.leagues.filter((l) => l.level === "C").pop()!

  // latest games from each league
  const lastRecGame = (recLeague.games || []).at(-1)
  const lastCGame = (cLeague.games || []).at(-1)

  return routePage({
    path: "/",
    title: "Suomi Poikas",
    description: "Suomi Poikas Hockey Club",
    metaImage: "/images/finland-flag-icon.png",
    sidebar: championLeagues.map((league) => ChampTile({ league })).join("\n"),
    main: `
      <article>
        <img src="/images/poikas-2019-rec-faceoff-brenden.jpg" alt="Suomi Poikas" class="splash" />
        <h2>Welcome!</h2>
        <p>
          Welcome to the official website of the Suomi Poikas, your favorite Finnish-American hockey team! Hyvä Suomi!
          🇫🇮
        </p>

        <h2>Latest Games</h2>
        <div class='latest-games'>
        ${
          lastRecGame
            ? `<a href="${recLeague.url}" class='game'>
                <div class='league'>Rec League</div>
                <div class='teams'>Poikas vs ${lastRecGame.vs} (${lastRecGame.date?.toLocaleDateString()})</div>
                <div class='result'>${lastRecGame.result} ${lastRecGame.us}-${lastRecGame.them}</div>
                ${lastRecGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastRecGame.sisu}` || ""}</div>` : ""}
                <div class='notable'>${lastRecGame.notable || ""}</div>
              </a>`
            : ""
        }
          ${
            lastCGame
              ? `<a href="${cLeague.url}" class='game'>
                  <div class='league'>C/CC League</div>
                  <div class='teams'>Poikas vs ${lastCGame.vs} (${lastCGame.date?.toLocaleDateString()})</div>
                  <div class='result'>${lastCGame.result} ${lastCGame.us}-${lastCGame.them}</div>
                  ${lastCGame.sisu ? `<div class='sisu'>${`🇫🇮 Sisu Cup: ${lastCGame.sisu}` || ""}</div>` : ""}
                  <div class='notable'>${lastCGame.notable || ""}</div>
                </a>`
              : ""
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
          <a class="details" href="${recLeague.url}">(view season page)</a>
        </h2>
        <table id="rec-roster" class="roster">
          <thead>
            <tr>
              <th width="50">Photo</th>
              <th>Name</th>
              <th width="30">#</th>
              <th width="30">Pos</th>
              <th width="30" class="extra">Ht</th>
              <th width="30" class="extra">Wt</th>
              <th width="30" class="extra">Sh</th>
              <th width="30" class="extra">Yrs</th>
              <th width="30" class="extra">Age</th>
            </tr>
          </thead>
          <tbody>
            ${recLeague
              .players!.map(
                (p) => `
                  <tr>
                    <td>${p.imageHTML || "-"}</td>
                    <td>${p.profileLink || "-"}</td>
                    <td>${p.number || "-"}</td>
                    <td>${p.pos || "-"}</td>
                    <td class="extra">${p.ht || "-"}</td>
                    <td class="extra">${p.wt || "-"}</td>
                    <td class="extra">${p.shoots || "-"}</td>
                    <td class="extra">${p.years || "-"}</td>
                    <td class="extra">${p.age() || "-"}</td>
                  </tr>
                `
              )
              .join("\n")}
          </tbody>
        </table>

        <h2>
          Current C/CC Roster
          <a class="details" href="${cLeague.url}">(view season page)</a>
        </h2>
        <table id="c-roster" class="roster">
          <thead>
            <tr>
              <th width="50">Photo</th>
              <th>Name</th>
              <th width="30">#</th>
              <th width="30">Pos</th>
              <th width="30" class="extra">Ht</th>
              <th width="30" class="extra">Wt</th>
              <th width="30" class="extra">Sh</th>
              <th width="30" class="extra">Yrs</th>
              <th width="30" class="extra">Age</th>
            </tr>
          </thead>
          <tbody>
            ${cLeague
              .players!.map(
                (p) => `
            <tr>
              <td>${p.imageHTML || "-"}</td>
              <td>${p.profileLink || "-"}</td>
              <td>${p.number || "-"}</td>
              <td>${p.pos || "-"}</td>
              <td class="extra">${p.ht || "-"}</td>
              <td class="extra">${p.wt || "-"}</td>
              <td class="extra">${p.shoots || "-"}</td>
              <td class="extra">${p.years || "-"}</td>
              <td class="extra">${p.age() || "-"}</td>
            </tr>
          `
              )
              .join("\n")}
          </tbody>
        </table>
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
            ${Object.entries(leagueSeasonsMap(data.leagues))
              .map(
                ([season, leagues]) => `
            <tr>
              <td>${season}</td>
              <td>${leagues.rec}</td>
              <td>${leagues.c}</td>
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
