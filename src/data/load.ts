import type { Game, Player, PoikasData, PoikasDataRaw, PlayerSeason, ArenaSeasonStats, SeasonName, LeagueName, Season, PlayerStats, PlayerGameStats } from "../types"
import { poikasData } from "./poikas"
import { img } from "../image"

const seasonsOrder: SeasonName[] = ["Spring", "Summer", "Fall"]
const levelsOrder: LeagueName[] = ["Rec", "C"]

// Import historical data, parsed from MVIA website
import historicalRecStats from "./historical/hockey_stats_rec.json"
import historicalCStats from "./historical/hockey_stats_c.json"

const historicalSeasons: ArenaSeasonStats[] = Object.values(historicalRecStats).concat(Object.values(historicalCStats))

let _data: PoikasData
export function getData(): PoikasData {
  if (!_data) _data = processPoikasData(poikasData)
  return _data
}

function processPoikasData(dataRaw: PoikasDataRaw): PoikasData {
  const data: PoikasData = dataRaw as PoikasData
  populateLeagueData(data)
  data.players.sort(sortPlayers)
  data.seasons.sort(sortSeasons)
  data.seasons.forEach((season) => populateSeasonData(season, data.players))
  data.players.forEach((player) => populatePlayerData(player, data))
  return data
}

function populateLeagueData(data: PoikasData) {
  const recSeasons: Season[] = data.seasons.filter((s) => s.leagueName === "Rec")
  const cSeasons: Season[] = data.seasons.filter((s) => s.leagueName === "C")
  data.leagues = {
    Rec: {
      name: "Rec",
      seasons: recSeasons,
      current: recSeasons.find((s) => s.current)!,
    },
    C: {
      name: "C",
      seasons: cSeasons,
      current: cSeasons.find((s) => s.current)!,
    },
  }
}

// Sort players by name
function sortPlayers(a: Player, b: Player): number {
  return a.name < b.name ? -1 : 1
}

// Sort leagues by year, season, and level
function sortSeasons(a: Season, b: Season): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.seasonName !== b.seasonName) return seasonsOrder.indexOf(a.seasonName) - seasonsOrder.indexOf(b.seasonName)
  return seasonsOrder.indexOf(a.seasonName) - levelsOrder.indexOf(b.leagueName)
}

function populateSeasonData(season: Season, players: Player[]) {
  // the "pending" playoffs status mean it's a current season
  season.current = season.playoffs === "pending"

  // url for the league page
  season.url = `/seasons/${season.year}/${season.seasonName.toLowerCase()}/${season.leagueName.toLowerCase()}`
  season.link = `<a href="${season.url}">${season.leagueName} ${season.year} ${season.seasonName}</a>`

  // Add historical data to the league
  season.arenaReportedStats = historicalSeasons.find((h) => h.year === season.year && h.season === season.seasonName && h.league === season.leagueName)

  // Add all roster players
  if (!season.players) season.players = []
  season.roster.forEach((playerName: string) => {
    const player: Player | undefined = players.find((p) => p.name === playerName)
    if (!player) return
    season.players!.push(player)
  })

  // for leagues with games listed, calculate w/l/t
  if (season.games) {
    season.wins = season.games.filter((g) => g.result === "won").length
    season.losses = season.games.filter((g) => g.result === "lost").length
    season.ties = season.games.filter((g) => g.result === "tied" || g.result === "lost-ot").length

    // populate game data for this season
    season.games.forEach((game) => populateGameData(game, season))
  }
}

// Attach all the data for a particular game
function populateGameData(game: Game, season: Season) {
  if (!season.players) throw new Error("Season requires players to be populated before games")

  // attach the current season to each game in that season
  game.season = season
  // attach the sisu player, if found
  game.sisuPlayer = season.players.find((p) => p.name === game.sisu)
  // attach the goalie player, if found
  game.goaliePlayer = season.players.find((p) => p.name === game.goalie)
  // link to opponent page
  game.vsURL = `/vs/${slugify(game.vs)}`
  game.vsLink = `<a href="${game.vsURL}">${game.vs}</a>`
}

// Add all the data for a particular player
function populatePlayerData(player: Player, data: PoikasData) {
  // attach seasons to each player for convenience
  player.seasons = { Rec: [], C: [] }
  player.activeSeasons = {}
  player.championships = 0

  if (!player.careerStats) player.careerStats = defaultStats()
  const cs: PlayerStats = player.careerStats

  data.seasons.forEach((season) => {
    // if the player is not on the roster that season, skip
    if (!season.roster.includes(player.name)) return

    // create a player season object for this player and season
    const playerSeason: PlayerSeason = {
      year: season.year,
      seasonName: season.seasonName,
      leagueName: season.leagueName,
      season: season,
      stats: defaultStats(),
    }

    // Shortcut for season stats
    const ss: PlayerStats = playerSeason.stats

    // add the player season to the player's seasons
    player.seasons[season.leagueName].push(playerSeason)

    // if this is a current season, mark the player as active and add to active seasons
    if (season.current) {
      player.active = true
      player.activeSeasons[season.leagueName] = playerSeason
    }

    // did we win a championship this season?
    if (season.playoffs === "champions") player.championships += 1

    // calculate the player's stats for this season
    let seasonGoals: number = 0
    let seasonAssists: number = 0
    let seasonPenalties: number = 0

    season.games?.forEach((game) => {
      if (!game.stats) return
      if (!game.result || game.result === "pending" || game.result === "cancelled") return

      // get the player's stats for this game
      const pgs: PlayerGameStats = game.stats[player.name]

      // add to the season totals
      seasonGoals += pgs?.goals || 0
      seasonAssists += pgs?.assists || 0
      seasonPenalties += pgs?.penalties || 0

      // did the player play goalie in this game?
      if (game.goalie === player.name) {
        ss.goalieGamesPlayed += 1
        ss.shotsFor += game.shotsUs || 0
        ss.shotsAgainst += game.shotsThem || 0
        ss.goalsAgainst += game.them || 0
        if ((game.them || 0) === 0) ss.shutouts += 1
        if (game.result === "won") ss.goalieWins += 1
        if (game.result === "lost") ss.goalieLosses += 1
        if (game.result === "lost-ot" || game.result === "tied") ss.goalieTies += 1
      }
    })

    // add all totals to career stats
    cs.goals += ss.goals
    cs.assists += ss.assists
    cs.points += ss.goals + ss.assists
    cs.penalties += ss.penalties
    cs.pim += ss.penalties * 3

    // Find the historical data for this season
    const arenaStats = season.arenaReportedStats?.players.find((h) => h.name === player.name)
    playerSeason.arenaPlayerSeasonStats = arenaStats

    // resolve the stats for this season -- use greater of tracked or historical
    seasonGoals = Math.max(seasonGoals, arenaStats?.goals || 0)
    seasonAssists = Math.max(seasonAssists, arenaStats?.assists || 0)
    seasonPenalties = Math.max(seasonPenalties, 0) // No arena penalties

    // Now these are the resolved stats, set for this player season
    ss.goals = seasonGoals
    ss.assists = seasonAssists
    ss.points = seasonGoals + seasonAssists
    ss.penalties = seasonPenalties
    ss.pim = seasonPenalties * 3

    populateGoalieStatsAggregates(ss)

    // Add totals for player's career
    cs.goals += ss.goals
    cs.assists += ss.assists
    cs.points += ss.points
    cs.penalties += ss.penalties
    cs.pim += ss.pim
    cs.goalieGamesPlayed += ss.goalieGamesPlayed
    cs.shotsFor += ss.shotsFor
    cs.shotsAgainst += ss.shotsAgainst
    cs.goalsAgainst += ss.goalsAgainst
    cs.shutouts += ss.shutouts
  })

  populateGoalieStatsAggregates(cs)

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
  player.imageHTML = `<img src="${player.imageURL}" alt="${player.name}" onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';">`

  // player profile URL
  player.profileURL = `/players/${player.slug}`
  player.profileLink = `<a href="${player.profileURL}">${player.name}</a>`
}

// Goalie stats aggregates based on totals
function populateGoalieStatsAggregates(stats: PlayerStats) {
  const gp: number = stats.goalieGamesPlayed
  const sa: number = stats.shotsAgainst
  const ga: number = stats.goalsAgainst
  const gw: number = stats.goalieWins
  const gl: number = stats.goalieLosses
  const gt: number = stats.goalieTies
  stats.savePercentage = parseFloat((sa > 0 ? ((sa - ga) / sa) * 100 : 0).toFixed(1))
  stats.goalsAgainstAverage = parseFloat((ga / gp).toFixed(2))
  stats.averageShotsAgainst = parseFloat((sa / gp).toFixed(2))
  stats.goalieRecord = `${gw}-${gl}-${gt}`
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
  return this.born ? new Date().getFullYear() - this.born : undefined
}

function defaultStats(): PlayerStats {
  return {
    goals: 0,
    assists: 0,
    points: 0,
    penalties: 0,
    pim: 0,
    goalieGamesPlayed: 0,
    goalieWins: 0,
    goalieLosses: 0,
    goalieTies: 0,
    goalieRecord: "",
    shotsFor: 0,
    shotsAgainst: 0,
    goalsAgainst: 0,
    savePercentage: 0,
    goalsAgainstAverage: 0,
    averageShotsAgainst: 0,
    shutouts: 0,
  }
}
