export function notableAbbr(notable: string | undefined, abbrLength = 30): string {
  if (!notable) return "-"

  // checks if length is < abbrLength and just returns it if so
  if (notable.length < abbrLength) return notable

  // if length is >= abbrLength, return the first abbrLength characters
  // wrapped in <abbr> tags with a title attribute containing the full string
  return `<abbr title="${notable}">${notable.slice(0, abbrLength)}…</abbr>`
}

export function shortenName(name: string | undefined): string {
  if (!name) return "-"
  const [first, last] = name.split(" ")
  if (!last) return first
  return `<abbr title="${name}">${first} ${last.slice(0, 1)}</abbr>`
}

export function fullPos(pos: string | undefined): string {
  if (!pos) return "-"
  if (pos === "D") return "Defense"
  if (pos === "G") return "Goalie"
  if (pos === "F") return "Forward"
  if (pos === "C") return "Center"
  if (pos === "W") return "Left Wing / Right Wing"
  if (pos === "L") return "Left Wing"
  if (pos === "R") return "Right Wing"
  if (pos === "LW") return "Left Wing"
  if (pos === "RW") return "Right Wing"
  return pos
}

export function fullShoots(shoots: string | undefined): string {
  if (!shoots) return "-"
  if (shoots === "L") return "Left"
  if (shoots === "R") return "Right"
  return "-"
}

export function fullPlayoffs(playoffs: string | undefined): string {
  if (!playoffs) return "-"
  if (playoffs === "champions") return "Champions!"
  if (playoffs === "canceled") return "Canceled"
  if (playoffs === "eliminated") return "Eliminated"
  if (playoffs === "eliminated-championship") return "Eliminated in Championship"
  return playoffs
}

export function fullRecord(wins: number | undefined, losses: number | undefined, ties: number | undefined): string {
  if (!wins && !losses && !ties) return "-"
  if (ties) return `${wins || 0}-${losses || 0}-${ties || 0}`
  return `${wins || 0}-${losses || 0}`
}
