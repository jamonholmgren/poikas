import type { Player } from "./types"
import { template } from "./template"
import { Champ } from "./champ"

type PlayerProps = {
  player: Player
  nextPlayer?: Player
  prevPlayer?: Player
}

export function PlayerPage({ player, nextPlayer, prevPlayer }: PlayerProps) {
  const sisuCups = [...player.seasons]
    .map((s) => {
      if (!s.games) return []

      const gamesWithSisu = s.games.filter((g) => g.sisu === player.name)

      return gamesWithSisu.map((g) => {
        return {
          season: `<a href="${s.url}">${s.year} ${s.season}</a>`,
          game: g.vs,
          sisu: `🇫🇮 ${g.sisu}`,
          notable: g.notable || "-",
        }
      })
    })
    .flat()

  const recSeasons = player.seasons.filter((s) => s.level === "Rec").length || "—"
  const cSeasons = player.seasons.filter((s) => s.level === "C").length || "—"

  // This table has each season
  type SeasonMap = {
    [label: string]: {
      rec: string
      c: string
    }
  }
  // Organize data by season
  const seasonsMap: SeasonMap = player.seasons.reduce((acc, league) => {
    const key = `${league.year} ${league.season}`
    if (!acc[key]) acc[key] = { rec: "", c: "" }

    const leagueUrl = `/season/?year=${
      league.year
    }&season=${league.season.toLowerCase()}&level=${league.level.toLowerCase()}`
    let leagueText = league.level === "Rec" ? "Rec League" : "C/CC League"
    if (league.playoffs === "champions") {
      leagueText += ` 🏆`
    }

    leagueText = `<a href="${leagueUrl}">${leagueText}</a>`

    if (league.aside) {
      leagueText += `<span class='extra'> (${league.aside})</span>`
    }

    if (league.level === "Rec") {
      acc[key].rec = leagueText
    } else if (["C", "CC"].includes(league.level)) {
      acc[key].c = leagueText
    }

    return acc
  }, {})

  // Now let's build the page.
  const html = template({
    path: player.profileURL,
    title: player.name,
    description: player.bio || "",
    sidebar: `
      <img
        src="${player.imageURL}"
        alt="${player.name} - Player Photo"
        id="playerimage"
        onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';"
      />
      <span class="caption" id="playerimagecaption">${player.name}</span>`,
    main: `
        <h2 id="playername">${player.name}</h2>
        <p id="bio">${player.bio || ""}</p>
        <h2>Player Info</h2>
        <table class="statsheet" id="statsheet">
          <tr>
            <th>Position</th>
            <td>${player.pos || "-"}</td>
          </tr>
          <tr>
            <th>Number</th>
            <td>${player.number || "-"}</td>
          </tr>
          <tr>
            <th>Age</th>
            <td>${player.age || "-"}</td>
          </tr>
          <tr>
            <th>Height</th>
            <td>${player.ht || "-"}</td>
          </tr>
          <tr>
            <th>Weight</th>
            <td>${player.wt || "-"}</td>
          </tr>
          <tr>
            <th>Shoots</th>
            <td>${player.shoots || "-"}</td>
          </tr>
          <tr>
            <th>Joined</th>
            <td>${player.startYear || "-"}</td>
          </tr>
          <tr>
            <th>Years</th>
            <td>${player.years || "-"}</td>
          </tr>
          <tr>
            <th>Rec Seasons</th>
            <td>${recSeasons}</td>
          </tr>
          <tr>
            <th>C/CC Seasons</th>
            <td>${cSeasons}</td>
          </tr>
          <tr>
            <th>Championships</th>
            <td>${Champ(player)}</td>
          </tr>
        </table>
      </article>
      <div class="seasons">
        <h2>Seasons Played with the Poikas</h2>
        <table id="seasons" class="seasons">
          <thead>
            <tr>
              <th data-field="season">Season</th>
              <th data-field="rec">Rec League</th>
              <th data-field="c">C/CC League</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(seasonsMap)
              .map(
                ([season, leagues]) => `
            <tr>
              <td>${season}</td>
              <td>${leagues.rec || "—"}</td>
              <td>${leagues.c || "—"}</td>
            </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="sisucup">
        <h2>Sisu Cups Won</h2>
        <p>
          The "Sisu Cup" is awarded to the player who demonstrates the most
          <strong>sisu</strong> <em>(pronounced – see’-soo)</em> in a game.
          Sisu is a Finnish word that doesn't have a precise equivalent in
          English, but is similar to "guts" or "grit" or "perseverance".
        </p>
        <table id="sisucup" class="seasons">
          <thead>
            <tr>
              <th data-field="season">Season</th>
              <th data-field="game">Game</th>
              <th data-field="sisu">Sisu Cup</th>
              <th data-field="notable" class="extra">Notable</th>
            </tr>
          </thead>
          <tbody>
            ${sisuCups
              .map(
                (cup) => `
            <tr>
              <td>${cup.season}</td>
              <td>${cup.game}</td>
              <td>${cup.sisu}</td>
              <td class="extra">${cup.notable}</td>
            </tr>
                `
              )
              .join("")}

          </tbody>
        </table>
      </div>
    `,
    footer: `
      <div class="prevnext">
        ${prevPlayer ? `<a href="${prevPlayer.profileURL}" id="prev">← ${prevPlayer.name}</a>` : ""}
        ${nextPlayer ? `<a href="${nextPlayer.profileURL}" id="next">${nextPlayer.name} →</a>` : ""}
      </div>
    `,
  })

  return html
}
