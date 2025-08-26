import type { Player, Season } from "../types"

type Column<T = Player> = {
  th: string
  width?: number
  alt?: string
  val?: string
  getValue?: (item: T) => string | number
  xtra?: boolean
  fb?: string
}

type RosterTableOptions<T = Player> = {
  columns: Column<T>[]
  players: T[]
  filter?: (item: T) => boolean
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
function getColumnValue<T>(item: T, column: Column<T>, season?: Season): string | number {
  if (column.getValue) return column.getValue(item)

  if (column.val) {
    const value = getValueByPath(item, column.val)
    if (value === undefined || Number.isNaN(value)) return column.fb || "-"
    return value
  }

  return column.fb || "-"
}

export function renderRosterTable<T = Player>(options: RosterTableOptions<T>): string {
  const { columns, players, filter, className = "roster", id } = options

  const filteredPlayers = filter ? players.filter(filter) : players

  const tableClass = className ? ` class="${className}"` : ""
  const tableId = id ? ` id="${id}"` : ""

  const headerRow = `
    <tr>
      ${columns
        .map(
          (col) => `
        <th${col.width ? ` width="${col.width}"` : ""}${col.alt ? ` title="${col.alt}"` : ""}${col.xtra ? ' class="extra"' : ""}>${col.th}</th>
      `
        )
        .join("")}
    </tr>
  `

  const bodyRows = filteredPlayers
    .map(
      (item) => `
      <tr>
        ${columns
          .map(
            (col) => `
          <td${col.xtra ? ' class="extra"' : ""}>${getColumnValue(item, col, options.season)}</td>
        `
          )
          .join("")}
      </tr>
    `
    )
    .join("")

  return `
    <div class="table-container">
      <table${tableClass}${tableId}>
        <thead>
          ${headerRow}
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </div>
  `
}
