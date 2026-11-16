import { routePage } from "../route"
import type { PoikasData } from "../types"
import { img } from "../image"

export function AboutPage(_data: PoikasData) {
  return routePage({
    path: "/about",
    title: "About Suomi Poikas",
    description: "Our history, community, and how to join Suomi Poikas Hockey Club",
    metaImage: img("000-placeholder.jpg"),
    sidebar: ``,
    main: `
      <article>
        <h1>About Suomi Poikas</h1>
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
          <a href="#join">see how to join below</a>.
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

        <h2 id="join">Join the team</h2>
        <p>
          If you're located in the southwest Washington state area, of Finnish
          descent, and interested in joining the team, please contact Joel
          Mattila. You can contact him on LinkedIn or Facebook. We won't put
          contact information here to avoid spam.
        </p>
        <p>
          We have a limited amount of spots available, so we can't guarantee a
          spot on the team. Seasons are Fall, Spring, and sometimes Summer.
          Fall is the longest, then Spring, and Summer is the shortest and
          most casual. We play every Saturday night at Mountain View Ice Arena
          in Vancouver, Washington.
        </p>
        <p>
          In addition to our Rec team (beginners), we also have a CC team
          for more advanced players.
        </p>
        <h2>Requirements</h2>
        <p>
          For Rec League, you should know the basics of skating and handling a
          puck, the basics of team hockey play, the rules, and be able to
          commit to a weekly Saturday night game schedule.
        </p>
        <p>
          You'll be expected to buy your own gear and pay the league fees,
          which range from $400-600 per season. You'll have to buy a jersey
          and socks (talk to Joel).
        </p>
        <p>
          Ideally, you'll have gone through the rink's adult skating and
          hockey classes before joining the team.
        </p>
        <p>
          Hockey isn't a cheap sport, but it's a lot of fun and there's great
          comradery. You'll probably spend a couple grand or more getting
          started, so just be aware of that.
        </p>
        <h2>Conduct</h2>
        <p>
          Suomi Poikas players should conduct themselves with respect toward
          the ice arena, officials, teammates, opponents, and fans. We expect
          players to be good sportsmen and sportswomen. We also expect players
          and our fans to be good citizens and good representatives of the
          Finnish community.
        </p>
      </article>
    `,
  })
}
