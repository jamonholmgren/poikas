export interface Game {
  vs: string
  us?: number
  them?: number
  shotsUs?: number
  shotsThem?: number
  result?: "won" | "lost" | "lost-ot" | "tied" | "forfeited" | "cancelled"
  sisu?: string
  notable?: string
  date?: Date
  goalie?: string
  stats?: Stats

  // convenience references
  goaliePlayer?: Player
  sisuPlayer?: Player
  league?: League
  vsURL?: string
  vsLink?: string
}

type LeagueRaw = {
  year: number
  season: string
  level: "Rec" | "C"
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
}

export type League = LeagueRaw & {
  // derived data that we add
  url: string
  current: boolean
  players?: Player[]
}

type PlayerRaw = {
  // original data from the JSON
  number?: number
  name: string
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
  leagues: League[]
  active: boolean
  recLink: string
  cLink: string
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
}

export interface LoadDisplaySeasonsOptions {
  order?: "asc" | "desc"
  player?: string
}

export interface PoikasDataRaw {
  players: PlayerRaw[]
  leagues: LeagueRaw[]
}

export interface PoikasData {
  players: Player[]
  leagues: League[]
}

export type SeasonMap = {
  [label: string]: {
    rec: string
    c: string
  }
}

export interface PlayerGameStats {
  player: string
  goals: number
  assists: number
}

// For use in functions that calculate season stats
export interface PlayerSeasonStats {
  player: Player
  league: League
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  shootoutGoals: number
  saves?: number
  shotsAgainst?: number
  gamesAsGoalie?: number
}

export type Stats = {
  [playerName: string]: {
    goals?: number
    assists?: number
  }
}
