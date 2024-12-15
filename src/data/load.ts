import type { Game, Player, PoikasData, PoikasDataRaw } from "../types"
import { poikasData } from "./poikas"
import { img } from "../image"

// Import historical data, parsed from MVIA website
import historicalRecStats from "./historical/hockey_stats_rec.json"
import historicalCStats from "./historical/hockey_stats_c.json"

const historicalSeasons = Object.values(historicalRecStats).concat(Object.values(historicalCStats))

let _data: PoikasData
export function getData(): PoikasData {
  if (!_data) _data = processPoikasData(poikasData)
  return _data
}

function processPoikasData(dataRaw: PoikasDataRaw): PoikasData {
  // cast the raw data to a PoikasData type so we can add data
  const data = dataRaw as PoikasData

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

    // url for the league page
    const season = league.season.toLowerCase()
    const level = league.level.toLowerCase()
    league.url = `/seasons/${league.year}/${season}/${level}`

    // Add historical data to the league
    league.historical = historicalSeasons.find(
      (h) => h.year === league.year && h.season === league.season && h.level === league.level
    )

    // for leagues with games listed, calculate w/l/t
    if (league.games) {
      league.wins = league.games.filter((g) => g.result === "won").length
      league.losses = league.games.filter((g) => g.result === "lost").length
      league.ties = league.games.filter((g) => g.result === "tied" || g.result === "lost-ot").length

      league.games.forEach((game) => {
        // attach the league to each game
        game.league = league
        // attach the sisu player, if found
        game.sisuPlayer = data.players.find((p) => p.name === game.sisu)
        // link to opponent page
        game.vsURL = `/vs/${slugify(game.vs)}`
        game.vsLink = `<a href="${game.vsURL}">${game.vs}</a>`
      })
    }
  })

  data.players.forEach((player) => {
    // attach seasons to each player for convenience
    player.leagues = data.leagues.filter((league) => league.roster.includes(player.name))

    // and the reverse too -- add players to each season
    player.leagues.forEach((season) => {
      season.players ||= []
      season.players.push(player)
    })

    // is this player currently active?
    player.active = player.leagues.some((season) => season.current)

    // rec and c/cc links
    const rec = player.leagues.find((s) => s.current && s.level === "Rec")
    const c = player.leagues.find((s) => s.current && s.level === "C")
    player.recLink = rec ? `<a href="/season/?year=${rec.year}&season=${rec.season}&level=${rec.level}">Rec</a>` : "-"
    player.cLink = c ? `<a href="/season/?year=${c.year}&season=${c.season}&level=${c.level}">C/CC</a>` : "-"

    // how many active calendar years has this player played?
    const activeYears = [...new Set(player.leagues.map((season) => season.year))]

    player.years = activeYears.length
    player.startYear = activeYears[0]
    player.endYear = activeYears[activeYears.length - 1]

    player.age = ageFunction

    // how many championships?
    player.championships = data.leagues
      .filter((league) => league.playoffs === "champions")
      .filter((league) => league.roster.includes(player.name)).length

    // player slug (for URLs)
    player.slug = slugify(player.name)

    // player image URL and HTML
    player.imageURL = img(`players/${player.slug}.jpg`)
    player.imageHTML = `<img src="${player.imageURL}" alt="${player.name}" onerror="this.onerror=null;this.src='${img(
      "000-placeholder.jpg"
    )}';">`

    // player profile URL
    player.profileURL = `/players/${player.slug}`
    player.profileLink = `<a href="${player.profileURL}">${player.name}</a>`

    // Initialize stats
    player.currentStats = { Rec: { goals: 0, assists: 0 }, C: { goals: 0, assists: 0 } }
    player.careerStats = { Rec: { goals: 0, assists: 0 }, C: { goals: 0, assists: 0 } }

    // Calculate stats across all leagues
    player.leagues.forEach((league) => {
      let leagueGoals = 0
      let leagueAssists = 0
      league.games?.forEach((game) => {
        if (!game.stats) return

        const playerStats = game.stats[player.name]

        leagueGoals += playerStats?.goals || 0
        leagueAssists += playerStats?.assists || 0
      })

      // Add to current season totals if this is a current league
      if (league.current) {
        player.currentStats[league.level].goals += leagueGoals
        player.currentStats[league.level].assists += leagueAssists
      }

      // Add the greater of the tracked stats or the historical stats to their career totals
      const historicalStats = league.historical?.players.find((h) => h.name === player.name)
      player.careerStats[league.level].goals += Math.max(leagueGoals, historicalStats?.goals || 0)
      player.careerStats[league.level].assists += Math.max(leagueAssists, historicalStats?.assists || 0)
    })
  })

  return data
}

export function gamesAgainstOpponent(data: PoikasData, slug: string) {
  // Find all the games against that opponent across rec and C seasons
  const recGames: Game[] = []
  const cGames: Game[] = []
  data.leagues.forEach((league) => {
    if (!league.games) return

    league.games?.forEach((game) => {
      if (game.vs && slugify(game.vs) === slug) {
        if (league.level === "Rec") recGames.push(game)
        if (league.level === "C") cGames.push(game)
      }
    })
  })
  return [recGames, cGames]
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^\w-]+/g, "") // remove all non-word chars
    .replace(/--+/g, "-") // replace multiple - with single -
}

function ageFunction(this: Player) {
  return this.born ? new Date().getFullYear() - this.born - 1 : undefined
}
