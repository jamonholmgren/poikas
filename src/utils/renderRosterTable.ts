import type { Player, Season } from "../types"

type Column = {
  h: string
  width?: number
  isExtra?: boolean
  t?: string
  v?: string
  getValue?: (player: Player) => string | number
  fb?: string
}

type RosterTableOptions = {
  columns: Column[]
  players: Player[]
  filter?: (player: Player) => boolean
  className?: string
  id?: string
  season?: Season
}

// Helper function to safely get a value using dot notation
function getValueByPath(obj: any, path: string): any {
  const parts = path.split(".")
  const lastPart = parts.pop()!
  const value = parts.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj)

  if (value === undefined) return undefined

  // If the last part is a function, call it with the proper this context
  if (typeof value[lastPart] === "function") {
    return value[lastPart].call(value)
  }

  return value[lastPart]
}

// Helper function to get a column's value
function getColumnValue(player: Player, column: Column, season?: Season): string | number {
  if (column.getValue) return column.getValue(player)

  if (column.v) {
    const value = getValueByPath(player, column.v)
    if (value === undefined) return column.fb || "-"
    return value
  }

  return column.fb || "-"
}

export function renderRosterTable(options: RosterTableOptions): string {
  const { columns, players, filter, className = "roster", id } = options

  const filteredPlayers = filter ? players.filter(filter) : players

  const tableClass = className ? ` class="${className}"` : ""
  const tableId = id ? ` id="${id}"` : ""

  const headerRow = `
    <tr>
      ${columns
        .map(
          (col) => `
        <th${col.width ? ` width="${col.width}"` : ""}${col.t ? ` title="${col.t}"` : ""}${col.isExtra ? ' class="extra"' : ""}>${col.h}</th>
      `
        )
        .join("")}
    </tr>
  `

  const bodyRows = filteredPlayers
    .map(
      (player) => `
      <tr>
        ${columns
          .map(
            (col) => `
          <td${col.isExtra ? ' class="extra"' : ""}>${getColumnValue(player, col, options.season)}</td>
        `
          )
          .join("")}
      </tr>
    `
    )
    .join("")

  return `
    <table${tableClass}${tableId}>
      <thead>
        ${headerRow}
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `
}
