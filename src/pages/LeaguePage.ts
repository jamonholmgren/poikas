import type { League } from "../types"
import { template } from "../template"

type LeagueProps = {
  league: League
}

export function LeaguePage({ league }: LeagueProps) {
  const { url, year, season, level, description, photos, wins, losses, ties, playoffs, videos, games } = league

  const metaImage = (photos && photos[0]) || "/images/finland-flag-icon.png"

  const leagueStandingsHTML = `<a href="${url}">Standings</a>`

  return template({
    path: url,
    title: `${year} ${season} ${level}`,
    description: `Suomi Poikas league ${year} ${season} ${level}`,
    metaImage,
    sidebar: `
      <img
        src="${metaImage}"
        alt="${year} ${season} ${level} - League Photo"
        id="leagueimage"
        onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';"
      />
      <span class="caption" id="leagueimagecaption">${year} ${season} ${level}</span>
    `,
    main: `
      <article>
        <h2 id="seasonname">${year} ${season} ${level}</h2>
        <p id="description">${description}</p>
        <table id="seasonresults" class="statsheet">
          <tr>
            <th>Standings/Schedule</th>
            <td>${leagueStandingsHTML}</td>
          </tr>
          <tr>
            <th>Wins</th>
            <td>${wins}</td>
          </tr>
          <tr>
            <th>Losses</th>
            <td>${losses}</td>
          </tr>
          <tr>
            <th>Ties/OT Losses</th>
            <td>${ties}</td>
          </tr>
          <tr>
            <th>Playoffs Result</th>
            <td>${playoffs}</td>
          </tr>
        </table>

        <div id="videos" class="videos">
          ${
            videos &&
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
              .join("\n")
          }
        </div>

        <h2>Roster</h2>
        <table id="roster" class="roster">
          <thead>
            <tr>
              <th data-field="imageHTML" width="50">Photo</th>
              <th data-field="profileLink">Name</th>
              <th data-field="number" width="30">#</th>
              <th data-field="pos" width="30">Pos</th>
              <th data-field="ht" width="30" class="extra">Ht</th>
              <th data-field="wt" width="30" class="extra">Wt</th>
              <th data-field="shoots" width="30" class="extra">Sh</th>
              <th data-field="years" width="30" class="extra">Yrs</th>
              <th data-field="age" width="30" class="extra">Age</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Games</h2>
        <table id="games" class="roster">
          <thead>
            <tr>
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
                      <td>${game.vs}</td>
                      <td>${game.result} ${game.us}-${game.them}</td>
                      <td>${game.sisu || "-"}</td>
                      <td class="extra">${game.notable || "-"}</td>
                    </tr>
                  `
                )
                .join("\n")
            }
          </tbody>
        </table>
      </article>
    `,
  })
}
