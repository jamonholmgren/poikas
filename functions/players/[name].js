// Import types from ../types.d.ts using JSDoc

/**
 * @type {import('../types').PoikasData} PoikasData
 * @type {import('../types').League} League
 * @type {import('../types').Player} Player
 * @type {import('../types').Game} Game
 **/

export async function onRequest(context) {
  // current file is ./functions/players/[name].js
  // grab the name from the context

  const name = context.params.name

  // turn jamon-holmgren into Jamon Holmgren in one line of code
  const fullName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  // Load all data from ../../poikas.json
  const data = require("../../poikas.json")

  // Process the data
  const poikasData = processPoikasData(data)

  // Find the player by name
  const player = poikasData.players.find((p) => p.name === fullName)

  // If the player doesn't exist, return a 404
  if (!player) {
    return new Response(`Player ${fullName} not found`, { status: 404 })
  }

  let champ = "-"
  if (player.championships > 0) {
    champ = `<span class="champion">${player.championships}`
    for (let i = 0; i < player.championships; i++) {
      champ += " 🏆"
    }
    champ += "</span>"
  }

  // find next alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1))
  const nextPlayer = data.players.find((p) => p.name > player.name)

  // find previous alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1))
  const prevPlayer = data.players.find((p) => p.name < player.name)

  const sisuCups = [...player.seasons]
    .map((s) => {
      if (!s.games) return []

      const gamesWithSisu = s.games.filter((g) => g.sisu === player.name)

      return gamesWithSisu.map((g) => {
        const seasonLink = `<a href="/season/?year=${s.year}&season=${s.season}&level=${s.level}">${s.year} ${s.season}</a>`
        return {
          season: seasonLink,
          game: g.vs,
          sisu: `🇫🇮 ${g.sisu}`,
          notable: g.notable || "-",
        }
      })
    })
    .flat()

  const recSeasons = player.seasons.filter((s) => s.level === "Rec").length || "—"
  const cSeasons = player.seasons.filter((s) => s.level === "C").length || "—"

  const currentRecSeason = poikasData.leagues.find((l) => l.current && l.level === "Rec")
  const currentCSeason = poikasData.leagues.find((l) => l.current && l.level === "C")

  // This table has each season
  // Organize data by season
  const seasonsMap = player.seasons.reduce((acc, league) => {
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
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${player.name} - Suomi Poikas Hockey Club</title>
    <link rel="stylesheet" href="/styles.css?c=2" />
    <link rel="icon" type="image/png" href="/images/finland-flag-icon.png" />

    <script src="/common.js?c=2"></script>
    <script src="/seasons.js?c=2"></script>
  </head>
  <body>
    <div class="header">
      <h1><a href="/">Suomi Poikas Hockey Club</a></h1>
    </div>
    <nav id="nav">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/season/?year=${currentRecSeason.year}&season=${currentRecSeason.season}&level=rec">Rec</a></li>
        <li><a href="/season/?year=${currentCSeason.year}&season=${currentCSeason.season}&level=c">C/CC</a></li>
        <li><a href="/players/">All Players</a></li>
        <li><a href="/join/">Join</a></li>
      </ul>
    </nav>
    <div class="container">
      <div class="sidebar">
        <img
          src="${player.imageURL}"
          alt="${player.name} - Player Photo"
          id="playerimage"
          onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';"
        />
        <span class="caption" id="playerimagecaption">${player.name}</span>
      </div>
      <main>
        <article>
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
              <td>${champ}</td>
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

        <div class="prevnext">
          ${prevPlayer ? `<a href="/player/?player=${prevPlayer.name}" id="prev">← ${prevPlayer.name}</a>` : ""}
          ${nextPlayer ? `<a href="/player/?player=${nextPlayer.name}" id="next">${nextPlayer.name} ➡</a>` : ""}
        </div>
      </main>
    </div>
    <!-- Google tag (gtag.js) -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-T6M8LZYF5Q"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-T6M8LZYF5Q");
    </script>
  </body>
</html>  
  `

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}

/**
 *
 * @param {PoikasData} data
 * @returns {PoikasData}
 */
function processPoikasData(data) {
  // Sort players by name
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1))

  // Sort leagues by year, season, and level
  const seasonsOrder = ["Spring", "Summer", "Fall"]
  const levelsOrder = ["Rec", "C"]
  data.leagues.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    if (a.season !== b.season) return seasonsOrder.indexOf(a.season) - seasonsOrder.indexOf(b.season)
    return seasonsOrder.indexOf(a.level) - levelsOrder.indexOf(b.level)
  })

  data.leagues.forEach((league) => {
    // the "pending" playoffs status mean it's a current season
    league.current = league.playoffs === "pending"

    // for leagues with games listed, calculate w/l/t
    if (league.games) {
      league.wins = league.games.filter((g) => g.result === "won").length
      league.losses = league.games.filter((g) => g.result === "lost").length
      league.ties = league.games.filter((g) => g.result === "tied" || g.result === "lost-ot").length
    }
  })

  data.players.forEach((player) => {
    // attach seasons to each player for convenience
    player.seasons = data.leagues.filter((league) => league.roster.includes(player.name))

    // and the reverse too -- add players to each season
    player.seasons.forEach((season) => {
      season.players ||= []
      season.players.push(player)
    })

    // is this player currently active?
    player.active = player.seasons.some((season) => season.current)

    // rec and c/cc links
    const rec = player.seasons.find((s) => s.current && s.level === "Rec")
    const c = player.seasons.find((s) => s.current && s.level === "C")
    player.recLink = rec ? `<a href="/season/?year=${rec.year}&season=${rec.season}&level=${rec.level}">Rec</a>` : "-"
    player.cLink = c ? `<a href="/season/?year=${c.year}&season=${c.season}&level=${c.level}">C/CC</a>` : "-"

    // how many active calendar years has this player played?
    const activeYears = [...new Set(player.seasons.map((season) => season.year))]

    player.years = activeYears.length
    player.startYear = activeYears[0]
    player.endYear = activeYears[activeYears.length - 1]

    player.age = player.born ? new Date().getFullYear() - player.born - 1 : undefined

    // how many championships?
    player.championships = data.leagues
      .filter((league) => league.playoffs === "champions")
      .filter((league) => league.roster.includes(player.name)).length

    // player image URL and HTML
    player.imageURL = `/images/${player.number}-${player.name.toLowerCase().replace(/\s+/g, "-")}.jpg`
    player.imageHTML = `<img src="${player.imageURL}" alt="${player.name}" onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';">`

    // player profile URL
    player.profileURL = `/player/?player=${player.name}`
    player.profileLink = `<a href="${player.profileURL}">${player.name}</a>`
  })

  return data
}
