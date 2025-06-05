import type { Game, Player, PoikasData, PoikasDataRaw, PlayerSeason } from "../types"
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
  const data: PoikasData = dataRaw as PoikasData

  data.leagues = {
    Rec: {
      name: "Rec",
      seasons: data.seasons.filter((s) => s.leagueName === "Rec"),
      current: data.seasons.find((s) => s.leagueName === "Rec" && s.current)!,
    },
    C: {
      name: "C",
      seasons: data.seasons.filter((s) => s.leagueName === "C"),
      current: data.seasons.find((s) => s.leagueName === "C" && s.current)!,
    },
  }

  // Sort players by name
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1))

  // Sort leagues by year, season, and level
  const seasonsOrder = ["Spring", "Summer", "Fall"]
  const levelsOrder = ["Rec", "C"]
  data.seasons.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    if (a.seasonName !== b.seasonName) return seasonsOrder.indexOf(a.seasonName) - seasonsOrder.indexOf(b.seasonName)
    return seasonsOrder.indexOf(a.leagueName) - levelsOrder.indexOf(b.leagueName)
  })

  data.seasons.forEach((season) => {
    // the "pending" playoffs status mean it's a current season
    season.current = season.playoffs === "pending"

    // url for the league page
    season.url = `/seasons/${season.year}/${season.seasonName.toLowerCase()}/${season.leagueName.toLowerCase()}`
    season.link = `<a href="${season.url}">${season.leagueName}</a>`

    // Add historical data to the league
    season.arenaReportedStats = historicalSeasons.find(
      (h) => h.year === season.year && h.season === season.seasonName && h.league === season.leagueName
    )

    // for leagues with games listed, calculate w/l/t
    if (season.games) {
      season.wins = season.games.filter((g) => g.result === "won").length
      season.losses = season.games.filter((g) => g.result === "lost").length
      season.ties = season.games.filter((g) => g.result === "tied" || g.result === "lost-ot").length

      season.games.forEach((game) => {
        // attach the league to each game
        game.season = season
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
    player.seasons = { Rec: [], C: [] }
    player.activeSeasons = {}
    player.championships = 0

    data.seasons.forEach((season) => {
      // if the player is not on the roster that season, skip
      if (!season.roster.includes(player.name)) return

      // create a player season object for this player and season
      const playerSeason: PlayerSeason = {
        year: season.year,
        seasonName: season.seasonName,
        leagueName: season.leagueName,
        season: season,
        stats: { goals: 0, assists: 0 }, // will fill out later
      }

      // add the player season to the player's seasons
      player.seasons[season.leagueName].push(playerSeason)

      // if this is a current season, mark the player as active and add to active seasons
      if (season.current) {
        player.active = true
        player.activeSeasons[season.leagueName] = playerSeason
      }

      // and the reverse too -- add players to each season
      season.players ||= []
      season.players.push(player)

      // did we win a championship this season?
      if (season.playoffs === "champions") player.championships += 1

      // calculate the player's stats for this season
      let seasonGoals = 0
      let seasonAssists = 0

      // Calculate goalie stats if player was a goalie in any games
      if (season.games) {
        const goalieGames = season.games.filter((game) => game.goalie === player.name)
        if (goalieGames.length > 0) {
          const totalShotsAgainst = goalieGames.reduce((sum, game) => sum + (game.shotsThem || 0), 0)
          const totalGoalsAgainst = goalieGames.reduce((sum, game) => sum + (game.them || 0), 0)
          const totalShotsFor = goalieGames.reduce((sum, game) => sum + (game.shotsUs || 0), 0)
          const gamesPlayed = goalieGames.length

          const savePercentage =
            totalShotsAgainst > 0 ? ((totalShotsAgainst - totalGoalsAgainst) / totalShotsAgainst) * 100 : 0
          const goalsAgainstAverage = totalGoalsAgainst / gamesPlayed
          const averageShotsAgainst = totalShotsAgainst / gamesPlayed

          playerSeason.stats.gamesPlayed = gamesPlayed
          playerSeason.stats.shotsFor = totalShotsFor
          playerSeason.stats.shotsAgainst = totalShotsAgainst
          playerSeason.stats.goalsAgainst = totalGoalsAgainst
          playerSeason.stats.savePercentage = parseFloat(savePercentage.toFixed(1))
          playerSeason.stats.goalsAgainstAverage = parseFloat(goalsAgainstAverage.toFixed(2))
          playerSeason.stats.averageShotsAgainst = parseFloat(averageShotsAgainst.toFixed(1))
        }
      }

      season.games?.forEach((game) => {
        if (!game.stats) return

        // get the player's stats for this game
        const playerStats = game.stats[player.name]

        // add to the season totals
        seasonGoals += playerStats?.goals || 0
        seasonAssists += playerStats?.assists || 0
      })

      // Find the historical data for this season
      const arenaStats = season.arenaReportedStats?.players.find((h) => h.name === player.name)
      playerSeason.arenaPlayerSeasonStats = arenaStats

      // resolve the stats for this season -- use greater of tracked or historical
      seasonGoals = Math.max(seasonGoals, arenaStats?.goals || 0)
      seasonAssists = Math.max(seasonAssists, arenaStats?.assists || 0)

      // Now these are the resolved stats, added to this player season
      playerSeason.stats.goals += seasonGoals
      playerSeason.stats.assists += seasonAssists
    })

    // how many active calendar years has this player played?
    const activeYears = [...new Set(Object.values(player.seasons).flatMap((seasons) => seasons.map((s) => s.year)))]

    player.years = activeYears.length
    player.startYear = activeYears[0]
    player.endYear = activeYears[activeYears.length - 1]

    player.age = ageFunction

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
  })

  return data
}

export function gamesAgainstOpponent(data: PoikasData, slug: string) {
  // Find all the games against that opponent across rec and C seasons
  const recGames: Game[] = []
  const cGames: Game[] = []
  data.seasons.forEach((league) => {
    if (!league.games) return

    league.games?.forEach((game) => {
      if (game.vs && slugify(game.vs) === slug) {
        if (league.leagueName === "Rec") recGames.push(game)
        if (league.leagueName === "C") cGames.push(game)
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
