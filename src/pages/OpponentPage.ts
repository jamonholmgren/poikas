import type { PoikasData } from "../types"
import { routePage } from "../route"
import { gamesAgainstOpponent } from "../data/load"

export function OpponentPage(data: PoikasData, slug: string) {
  const [recGames, cGames] = gamesAgainstOpponent(data, slug)

  const sampleGame = recGames[0] || cGames[0]
  if (!sampleGame) return new Response(`No games against opponent ${slug} found`, { status: 404 })

  const name = sampleGame.vs || slug

  const recWins = recGames.filter((g) => g.result === "won").length
  const recLosses = recGames.filter((g) => g.result === "lost").length
  const recTies = recGames.filter((g) => g.result === "tied" || g.result === "lost-ot").length

  const cWins = cGames.filter((g) => g.result === "won").length
  const cLosses = cGames.filter((g) => g.result === "lost").length
  const cTies = cGames.filter((g) => g.result === "tied" || g.result === "lost-ot").length

  return routePage({
    path: `/vs/${slug}`,
    title: `Poikas vs ${name}`,
    description: "Games between the Suomi Poikas and " + name,
    // metaImage: ,
    sidebar: ``,
    // <img
    //   src="${player.imageURL}"
    //   alt="${player.name} - Player Photo"
    //   id="playerimage"
    //   onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
    // />
    // <span class="caption" id="playerimagecaption">${player.name}</span>`,
    main: `
      <article>
        <h2 id="playername">${name}</h2>
        <p id="bio">Games played between the Suomi Poikas and the ${name}.</p>

        ${
          recGames.length > 0
            ? `
        <h2>Rec League</h2>

        <div class="table-container">
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
        </div>

        <div class="table-container">
          <table id="rec-games" class="roster">
            <thead>
              <tr>
                <th>Season</th>
                <th class="extra">Opponent</th>
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
                        <td><a href="${game.season?.url}">${game.season?.year} ${game.season?.seasonName}</a></td>
                        <td class="extra">${game.vs}</td>
                        <td>${game.result} ${game.us}-${game.them}</td>
                        <td>${game.sisuPlayer?.profileLink || "-"}</td>
                        <td class="extra">${game.notable || "-"}</td>
                      </tr>
                    `
                )
                .join("\n")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          cGames.length > 0
            ? `
        <h2>C/CC League</h2>

        <div class="table-container">
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
        </div>

        <div class="table-container">
          <table id="rec-games" class="roster">
            <thead>
              <tr>
                <th>Season</th>
                <th class="extra">Opponent</th>
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
                        <td><a href="${game.season?.url}">${game.season?.year} ${game.season?.seasonName}</a></td>
                        <td class="extra">${game.vs}</td>
                        <td>${game.result} ${game.us}-${game.them}</td>
                        <td>${game.sisuPlayer?.profileLink || "-"}</td>
                        <td class="extra">${game.notable || "-"}</td>
                      </tr>
                    `
                )
                .join("\n")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
      </article>
    `,
    footer: ``,
  })
}
