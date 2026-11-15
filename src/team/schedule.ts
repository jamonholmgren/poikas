import type { PoikasData } from "../types"
import { JsonStore, blankState, type Fixture } from "./store"
import { fixtures, seasonKey, pacificDay } from "./games"
const text = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
export function parseSchedule(html: string, league: string, season: string): Fixture[] {
  const output: Fixture[] = []
  for (const row of html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || []) {
    const cells = [...row.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)]
    const cell = (name: string) => cells.find((c) => new RegExp(`data-th="${name}"`, "i").test(c[1]))?.[2] || ""
    const dateMatch = cell("Date").match(/[?&](?:amp;)?d=(\d{1,2})(?:\/|%2f)(\d{1,2})(?:\/|%2f)(\d{4})/i)
    const game = row.match(/href="[^\"]*\/games\/(\d+)\/[^\"]*"/i)
    const home = text(cell("Home")),
      away = text(cell("Away"))
    if (!dateMatch || !game || !home || !away) continue
    if (!/Suomi Poikas/i.test(home + away)) continue
    const date = `${dateMatch[3]}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`
    const status = text(cell("Time/Status")),
      time = status.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] || ""
    output.push({ id: game[1], key: `mvia-${game[1]}`, league, season, date, time, vs: /Suomi Poikas/i.test(home) ? away : home, cancelled: /cancelled|canceled/i.test(status) })
  }
  if (output.length < 2 || new Set(output.map((f) => f.id)).size !== output.length) throw new Error(`Could not read the ${league} schedule. The saved schedule is still available.`)
  return output
}
export class ScheduleSync {
  running = false
  constructor(
    readonly store: JsonStore,
    readonly data: PoikasData,
  ) {}
  async run() {
    if (this.running) throw new Error("Schedule refresh is already running.")
    this.running = true
    const now = new Date().toISOString()
    try {
      const current = this.data.seasons.filter((s) => s.current && s.schedule)
      const fetched = await Promise.all(
        current.map(async (s) => {
          const url = new URL(s.schedule!)
          if (url.hostname !== "mountainview.ezleagues.ezfacility.com") throw new Error("Unexpected schedule source")
          const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
          if (!res.ok) throw new Error("MVIA is unavailable. The saved schedule is still available.")
          return parseSchedule(await res.text(), s.leagueName, seasonKey(s))
        }),
      )
      if (!fetched.length) throw new Error("No current MVIA schedules are configured.")
      this.store.change("state", blankState, (state) => {
        const base = fixtures(this.data, { ...state, schedule: [] })
        const used = new Set<string>()
        for (const fresh of fetched.flat()) {
          const previous = state.schedule.find((f) => f.id === fresh.id)
          const match =
            previous ||
            base.find(
              (f) =>
                f.season === fresh.season && f.date === fresh.date && f.vs.toLowerCase().replace(/ cc$/, "") === fresh.vs.toLowerCase().replace(/ cc$/, "") && !used.has(f.key),
            )
          if (match) fresh.key = match.key
          used.add(fresh.key)
          fresh.time ||= previous?.time || match?.time || ""
          fresh.changedAt = previous?.changedAt
          if (previous && (previous.date !== fresh.date || previous.time !== fresh.time || previous.cancelled !== fresh.cancelled)) fresh.changedAt = now
          const index = state.schedule.findIndex((f) => f.id === fresh.id)
          if (index < 0) state.schedule.push(fresh)
          else state.schedule[index] = fresh
        }
        state.sync = { lastAttempt: now, lastSuccess: now, day: pacificDay() }
      })
    } catch (e: any) {
      this.store.change("state", blankState, (s) => {
        s.sync = { ...s.sync, lastAttempt: now, day: pacificDay(), error: String(e.message).slice(0, 240) }
      })
      throw e
    } finally {
      this.running = false
    }
  }
  tick() {
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date()))
    const sync = this.store.state().sync
    if (!this.running && (!sync.lastAttempt || (hour >= 10 && sync.day !== pacificDay()))) this.run().catch((e) => console.error("MVIA schedule:", e.message))
    try {
      this.store.dailyBackup()
    } catch (e: any) {
      console.error("Team backup:", e.message)
    }
  }
}
