export interface Game {
  vs?: string
  us?: number
  them?: number
  result?: "won" | "lost" | "lost-ot" | "tied" | "forfeited" | "cancelled"
  sisu?: string
  notable?: string
}

type LeagueRaw = {
  year: number
  season: string
  level: string
  playoffs: string
  roster: string[]

  // WLT can be derived from game results or explicitly set
  wins?: number
  losses?: number
  ties?: number

  // optional data
  games?: Game[]
  description?: string
  aside?: string
  photos?: string[]
  videos?: string[]
  schedule?: string
}

type League = LeagueRaw & {
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
  seasons: League[]
  active: boolean
  recLink: string
  cLink: string
  years: number
  startYear: number
  endYear: number
  age: number | undefined
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