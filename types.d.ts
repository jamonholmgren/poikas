export interface Game {
  vs?: string
  us?: number
  them?: number
  result?: "won" | "lost" | "lost-ot" | "tied" | "forfeited" | "cancelled"
  sisu?: string
  notable?: string
}

type League = {
  year: number
  season: string
  level: string
  wins: number
  losses: number
  ties: number
  playoffs: string
  roster: string[]
  games: Game[]

  // processed data that we add
  current?: boolean
  players?: Player[]
}

type Player = {
  // original data from the JSON
  number?: number
  name: string
  bio?: string
  pos?: string
  shoots?: string
  ht?: string
  wt?: number
  born?: number

  // processed data that we add later
  seasons: League[]
  active: boolean
  recLink: string
  cLink: string
  years: number
  startYear: number
  endYear: number
  age: number | undefined
  championships: number
  imageURL: string
  imageHTML: string
  profileURL: string
  profileLink: string
}

export interface LoadDisplaySeasonsOptions {
  order?: "asc" | "desc"
  player?: string
}

export interface PoikasData {
  players: Player[]
  leagues: League[]
}
