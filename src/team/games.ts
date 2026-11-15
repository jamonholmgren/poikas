import type { Game, PoikasData, Season } from "../types"
import type { State } from "./store"
import { idFor } from "./store"
export type TeamFixture = {
  key: string
  season: string
  league: string
  date: string
  time: string
  vs: string
  result: string
  score?: string
  cancelled: boolean
  changedAt?: string
  sourceId?: string
  raw?: Game
  roster: string[]
}
export const seasonKey = (s: Season) => `${s.year}-${s.seasonName.toLowerCase()}-${s.leagueName.toLowerCase()}`
export const pacificDay = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
export function fixtures(data: PoikasData, state: State): TeamFixture[] {
  const all: TeamFixture[] = []
  for (const s of data.seasons)
    (s.games || []).forEach((g, i) => {
      const date = g.date?.toISOString().slice(0, 10) || `undated-${i}`
      const generatedKey =
        `${seasonKey(s)}-${date}-${idFor(g.vs)}` + ((s.games || []).filter((x) => x.date?.toISOString() === g.date?.toISOString() && x.vs === g.vs).length > 1 ? `-${i}` : "")
      const mapped = state.schedule.find((f) => f.season === seasonKey(s) && (f.key === generatedKey || (f.date === date && idFor(f.vs) === idFor(g.vs))))
      const key = mapped?.key || generatedKey
      all.push({
        key,
        season: seasonKey(s),
        league: s.leagueName,
        date,
        time: g.notable?.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/i)?.[0] || "",
        vs: g.vs,
        result: g.result || "pending",
        score: g.us !== undefined && g.them !== undefined ? `${g.us}–${g.them}` : undefined,
        cancelled: g.result === "cancelled",
        raw: g,
        roster: s.roster,
      })
    })
  for (const f of state.schedule) {
    const base = all.find((x) => x.key === f.key)
    if (base) {
      Object.assign(base, { date: f.date, time: f.time || base.time, cancelled: f.cancelled || base.cancelled, changedAt: f.changedAt, sourceId: f.id })
      base.vs = f.vs
    } else {
      const s = data.seasons.find((s) => seasonKey(s) === f.season)
      if (s) all.push({ ...f, result: f.cancelled ? "cancelled" : "pending", sourceId: f.id, roster: s.roster })
    }
  }
  return all.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}
export function players(data: PoikasData, state: State) {
  const result = new Map(data.players.map((p) => [idFor(p.name), { id: idFor(p.name), name: p.name, goalie: p.pos === "G" }]))
  for (const [id, p] of Object.entries(state.extraPlayers)) if (!result.has(id)) result.set(id, { id, name: p.name, goalie: false })
  return [...result.values()].sort((a, b) => a.name.localeCompare(b.name))
}
export function attendance(data: PoikasData, state: State, f: TeamFixture) {
  const g = state.games[f.key]
  const ids = new Set([
    ...f.roster.map(idFor),
    ...Object.entries(state.extraPlayers)
      .filter(([, p]) => p.teams.includes(f.season))
      .map(([id]) => id),
    ...(g?.guests || []),
  ])
  for (const name of Object.keys(f.raw?.stats || {})) ids.add(idFor(name))
  if (f.raw?.goalie) ids.add(idFor(f.raw.goalie))
  return players(data, state)
    .filter((p) => ids.has(p.id))
    .map((p) => {
      const saved = g && Object.hasOwn(g.attendance, p.id) ? g.attendance[p.id] : undefined
      const recorded =
        !!f.raw && !["pending", "cancelled", "forfeited"].includes(f.raw.result || "pending") && (Object.hasOwn(f.raw.stats || {}, p.name) || f.raw.goalie === p.name)
      return { ...p, status: (recorded ? "in" : saved?.status || "unknown") as "in" | "out" | "unknown", note: saved?.note || "", recorded, updatedAt: saved?.updatedAt }
    })
}
