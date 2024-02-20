export interface Game {
  vs?: string;
  us?: number;
  them?: number;
  result?: "won" | "lost" | "lost-ot" | "tied" | "forfeited" | "cancelled";
  sisu?: string;
  notable?: string;
}

export interface League {
  year: number;
  season: string;
  level: string;
  description?: string;
  highlights?: Highlight[];
  aside?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  playoffs?: string;
  roster: string[];
}

export interface Player {
  number?: number;
  name: string;
  bio?: string;
  role?: string;
  pos?: string;
  shoots?: string;
  born?: number;
  ht?: string;
  wt?: number;
  seasons?: League[]; // added in loadData transform
  years?: number;
  startYear?: number;
  endYear?: number;
  age?: number;
  championships?: number;
}

export interface RosterUpdateConfig {
  year: number;
  season: string;
  level: string;
}

export interface LoadDisplaySeasonsOptions {
  order?: "asc" | "desc";
  player?: string;
}

export interface RosterData {
  players: Player[];
  leagues: League[];
}
