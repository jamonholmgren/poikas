import type { Game, Player } from "../types"
import { template } from "../template"

type OpponentProps = {
  slug: string
  name: string
  recGames: Game[]
  cGames: Game[]
}

export function OpponentPage({ slug, name, recGames, cGames }: OpponentProps) {
  const recWins = recGames.filter((g) => g.result === "won").length
  const recLosses = recGames.filter((g) => g.result === "lost").length
  const recTies = recGames.filter((g) => g.result === "tied").length

  const cWins = cGames.filter((g) => g.result === "won").length
  const cLosses = cGames.filter((g) => g.result === "lost").length
  const cTies = cGames.filter((g) => g.result === "tied").length

  return template({
    path: `/vs/${slug}`,
    title: `Poikas vs ${name}`,
    description: "Games between the Suomi Poikas and " + name,
    // metaImage: ,
    sidebar: ``,
    // <img
    //   src="${player.imageURL}"
    //   alt="${player.name} - Player Photo"
    //   id="playerimage"
    //   onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';"
    // />
    // <span class="caption" id="playerimagecaption">${player.name}</span>`,
    main: `
      <article>
        <h2 id="playername">${name}</h2>
        <p id="bio">Games played between the Suomi Poikas and the ${name}.</p>

        <h2>Rec League</h2>

        <table class="statsheet" id="statsheet">
          <tr>
            <th>All Time Wins</th>
            <td>${recWins}</td>
          </tr>
          <tr>
            <th>All Time Losses</th>
            <td>${recLosses}</td>
          </tr>
          <tr>
            <th>All Time Ties/OT Losses</th>
            <td>${recTies}</td>
          </tr>
        </table>

        <table id="rec-games" class="roster">
          <thead>
            <tr>
              <th>Season</th>
              <th>Opponent</th>
              <th>Score</th>
              <th>Sisu Cup</th>
              <th class="extra">Notable</th>
            </tr>
          </thead>
          <tbody>
            ${recGames
              .map(
                (game) => `
                    <tr>
                      <td><a href="${game.league.url}">${game.league.year} ${game.league.season}</a></td>
                      <td>${game.vs}</td>
                      <td>${game.result} ${game.us}-${game.them}</td>
                      <td>${game.sisuPlayer?.profileLink || "-"}</td>
                      <td class="extra">${game.notable || "-"}</td>
                    </tr>
                  `
              )
              .join("\n")}
          </tbody>
        </table>

        <h2>C/CC League</h2>

        <table class="statsheet" id="statsheet">
          <tr>
            <th>All Time Wins</th>
            <td>${cWins}</td>
          </tr>
          <tr>
            <th>All Time Losses</th>
            <td>${cLosses}</td>
          </tr>
          <tr>
            <th>All Time Ties/OT Losses</th>
            <td>${cTies}</td>
          </tr>
        </table>

        <table id="rec-games" class="roster">
          <thead>
            <tr>
              <th>Season</th>
              <th>Opponent</th>
              <th>Score</th>
              <th>Sisu Cup</th>
              <th class="extra">Notable</th>
            </tr>
          </thead>
          <tbody>
            ${cGames
              .map(
                (game) => `
                    <tr>
                      <td><a href="${game.league.url}">${game.league.year} ${game.league.season}</a></td>
                      <td>${game.vs}</td>
                      <td>${game.result} ${game.us}-${game.them}</td>
                      <td>${game.sisuPlayer?.profileLink || "-"}</td>
                      <td class="extra">${game.notable || "-"}</td>
                    </tr>
                  `
              )
              .join("\n")}
          </tbody>
        </table>
      </article>
    `,
    footer: ``,
  })
}
