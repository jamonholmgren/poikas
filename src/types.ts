export type SeasonName = "Fall" | "Spring" | "Summer"
export type LeagueName = "Rec" | "C"

// A league is a collection of seasons, like Rec or C
export type League = {
  name: LeagueName
  seasons: Season[]
  current: Season | undefined
}

export type SeasonRaw = {
  year: number
  seasonName: SeasonName
  leagueName: LeagueName
  playoffs: string
  roster: string[]

  // WLT can be derived from game results or explicitly set
  wins?: number
  losses?: number
  ties?: number

  // optional data
  sidebar?: string
  games?: Game[]
  description?: string
  aside?: string
  photos?: string[]
  videos?: string[]
  schedule?: string
  // if true, we won't show goalie stats for this season, due to missing data
  ignoreGoalieStats?: boolean
}

export type Season = SeasonRaw & {
  // derived data that we add
  url: string
  link: string
  current: boolean
  players?: Player[]
  arenaReportedStats?: ArenaSeasonStats
}

export interface Game {
  // original data from the JSON
  vs: string
  us?: number
  them?: number
  shotsUs?: number
  shotsThem?: number
  result?: "pending" | "won" | "lost" | "lost-ot" | "tied" | "forfeited" | "cancelled"
  sisu?: string
  notable?: string
  date?: Date
  goalie?: string
  stats?: GameStats

  // convenience references we add later
  goaliePlayer?: Player
  sisuPlayer?: Player
  season?: Season
  vsURL?: string
  vsLink?: string
}

type PlayerRaw = {
  // original data from the JSON
  name: string
  number?: number
  bio?: string
  pos?: string
  shoots?: string
  ht?: string
  wt?: number
  born?: number
  role?: "captain"
}

export type Player = PlayerRaw & {
  // derived data that we add
  seasons: {
    [K in LeagueName]: PlayerSeason[]
  }
  activeSeasons: {
    [K in LeagueName]?: PlayerSeason
  }
  shortName: string
  active: boolean
  years: number
  startYear: number
  endYear: number
  age: () => number | undefined
  championships: number
  slug: string
  imageURL: string
  imageHTML: string
  profileURL: string
  profileLink: string
  shortProfileLink: string
  careerStats: PlayerStats
  arenaPlayerSeasonStats: ArenaPlayerSeasonStats[]
  arenaGoalieSeasonStats: ArenaGoalieSeasonStats[]
}

export type PlayerSeason = {
  year: number
  seasonName: SeasonName
  leagueName: LeagueName
  season: Season
  stats: PlayerStats
  arenaPlayerSeasonStats?: ArenaPlayerSeasonStats
}

// Can be for a game, season, or career
export type PlayerStats = {
  goals: number
  assists: number
  points: number // goals + assists
  penalties: number
  pim: number // penalty minutes (penalties * 3)
  // Goalie stats
  goalieGamesPlayed: number
  goalieGamesWithShots: number
  goalieWins: number
  goalieLosses: number
  goalieTies: number
  shotsFor: number
  shotsAgainst: number
  goalsAgainst: number
  goalsAgainstWithShots: number
  saves: number
  savePercentage: number
  goalsAgainstAverage: number
  averageShotsAgainst: number
  shutouts: number

  // formatted strings
  goalieRecord: string
  goalsAgainstAverageFormatted: string
  averageShotsAgainstFormatted: string
  savePercentageFormatted: string
}

export interface LoadDisplaySeasonsOptions {
  order?: "asc" | "desc"
  player?: string
}

export interface PoikasDataRaw {
  players: PlayerRaw[]
  seasons: SeasonRaw[]
}

export interface PoikasData {
  leagues: {
    [K in LeagueName]: League
  }
  players: Player[]
  seasons: Season[]
}

export type SeasonMap = {
  [label: string]: {
    [ln in LeagueName]: string
  }
}

export type PlayerGameStats = {
  goals?: number
  assists?: number
  penalties?: number
}

export type GameStats = {
  [playerName: string]: PlayerGameStats
}

// Historical data from MVIA (src/data/historical/*.json)

export interface ArenaTeamStanding {
  team_name: string
  points: number
  wins: number
  losses: number
  ties: number
  games_played: number
  otl: number
  goals_for: number
  goals_against: number
  goal_differential: number
}

export interface ArenaPlayerSeasonStats {
  name: string
  number: string
  games_played: number
  goals: number
  assists: number
  points: number
  penalty_minutes: number
}

export interface ArenaGoalieSeasonStats {
  name: string
  number: string
  games_played: number
  wins: number
  losses: number
  ot_losses: number
  saves: number
  goals_against: number
  gaa: number
  save_percentage: number
  shutouts: number
}

export interface ArenaSeasonStats {
  year: number
  season: string
  league: string
  standings: ArenaTeamStanding[]
  players: ArenaPlayerSeasonStats[]
  goalies: ArenaGoalieSeasonStats[]
}

export type ArenaStats = {
  [season: string]: ArenaSeasonStats
}

export type PoikasImage = {
  path: string
  caption: string
  players: string[]
  credit: string
}
