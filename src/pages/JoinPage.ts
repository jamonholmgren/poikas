import { layout } from "../layout"

export function JoinPage() {
  return layout({
    path: "/join/",
    title: "Join Suomi Poikas",
    description: "Join us! Suomi Poikas Hockey Club",
    metaImage: "/images/000-placeholder.jpg",
    sidebar: `
      <img src="/images/poikas-2019-rec-faceoff-brenden.jpg" alt="Suomi Poikas" />
      <span class="caption">Suomi Poikas</span>
    `,
    main: `
      <article>
        <h2>Join the team</h2>
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
          In addition to our Rec team (beginners), we also have a C/CC team
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
