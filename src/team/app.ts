import { join } from "node:path"
import type { PoikasData } from "../types"
import { JsonStore, blankAuth, blankState, digest, token, idFor, gameState, validBackup } from "./store"
import { fixtures, players, attendance, seasonKey, pacificDay } from "./games"
import { ScheduleSync } from "./schedule"
import { teamPage } from "./page"

const SESSION = "poikas_team"
const slots = new Set([
  ...Array.from({ length: 4 }, (_, i) => ["LW", "C", "RW"].map((p) => `F${i + 1}-${p}`)).flat(),
  ...Array.from({ length: 3 }, (_, i) => ["LD", "RD"].map((p) => `D${i + 1}-${p}`)).flat(),
  "G",
])
class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}
function fail(status: number, message: string): never {
  throw new HttpError(status, message)
}
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
  })
export class TeamApp {
  readonly store: JsonStore
  readonly sync: ScheduleSync
  readonly enabled: boolean
  constructor(
    readonly data: PoikasData,
    options: { dir?: string; enabled?: boolean; origin?: string } = {},
  ) {
    this.store = new JsonStore(options.dir || process.env.POIKAS_DATA_DIR || join(import.meta.dir, "../../.runtime/team"))
    this.enabled = options.enabled ?? process.env.POIKAS_WRITES_ENABLED === "1"
    this.origin = options.origin || process.env.POIKAS_ORIGIN || "https://suomipoikas.com"
    this.sync = new ScheduleSync(this.store, data)
    const supplied = process.env.POIKAS_ADMIN_PASSWORD
    if (supplied && !this.store.auth().adminHash) {
      if (supplied.length < 8) throw new Error("Use an admin password of at least 8 characters.")
      this.store.change("auth", blankAuth, (a) => {
        a.adminHash = Bun.password.hashSync(supplied)
      })
    }
  }
  origin: string
  start() {
    if (this.enabled) {
      this.sync.tick()
      setInterval(() => this.sync.tick(), 60000).unref()
    }
  }
  session(req: Request) {
    const cookie = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(SESSION + "="))
      ?.slice(SESSION.length + 1)
    const s = cookie && this.store.auth().sessions[digest(cookie)]
    return s && (s.expires === null || s.expires > Date.now()) ? s : undefined
  }
  login(player?: string, admin = false) {
    const value = token()
    this.store.change("auth", blankAuth, (a) => {
      for (const [key, s] of Object.entries(a.sessions)) if (s.expires !== null && s.expires <= Date.now()) delete a.sessions[key]
      a.sessions[digest(value)] = { player, admin, expires: null }
    })
    return this.cookie(value)
  }
  cookie(value: string) {
    const secure = this.origin.startsWith("https:") ? "; Secure" : ""
    // Browsers cap cookie lifetime. Renew it on each visit; server sessions never expire.
    return `${SESSION}=${value}; Path=/team; HttpOnly; SameSite=Lax; Max-Age=34560000${secure}`
  }
  attempt(ip: string, identity: string) {
    let limited = false
    this.store.change("auth", blankAuth, (a) => {
      for (const [key, x] of Object.entries(a.attempts)) if (x.until < Date.now()) delete a.attempts[key]
      for (const [key, max] of [
        [digest("ip:" + ip), 30],
        [digest("user:" + identity), identity === "admin" ? 8 : 6],
      ] as const) {
        const x = (a.attempts[key] ||= { count: 0, until: Date.now() + 15 * 60000 })
        x.count++
        if (x.count > max) limited = true
      }
    })
    if (limited) fail(429, "Too many attempts. Try again in 15 minutes, or ask the admin for a PIN link.")
  }
  async handle(req: Request, ip = "unknown"): Promise<Response> {
    const url = new URL(req.url),
      path = url.pathname
    try {
      if (path === "/team/app.js" || path === "/team/app.css")
        return new Response(Bun.file(join(import.meta.dir, path.endsWith(".js") ? "client.js" : "style.css")), {
          headers: { "content-type": path.endsWith(".js") ? "text/javascript" : "text/css", "cache-control": "no-cache", "x-content-type-options": "nosniff" },
        })
      if (!path.startsWith("/team/api/"))
        return new Response(teamPage(), {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "referrer-policy": "no-referrer",
            "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
          },
        })
      const actor = this.session(req),
        state = this.store.state(),
        all = fixtures(this.data, state)
      if (path === "/team/api/state" && req.method === "GET") {
        const roster = players(this.data, state).filter(
          (p) => this.data.seasons.some((s) => s.current && s.roster.includes(p.name)) || Object.hasOwn(state.extraPlayers, p.id) || actor?.player === p.id,
        )
        if (!actor) return json({ me: null, enabled: this.enabled, players: roster.map((p) => ({ id: p.id, name: p.name })), adminReady: !!this.store.auth().adminHash })
        const seasons = this.data.seasons
          .filter((s) => s.games?.length)
          .map((s) => ({ key: seasonKey(s), name: `${s.year} ${s.seasonName} ${s.leagueName}`, league: s.leagueName, current: s.current }))
          .reverse()
        let selectedSeason = url.searchParams.get("season")
        const game = all.find((f) => f.key === url.searchParams.get("game"))
        if (game) selectedSeason = game.season
        if (!selectedSeason || !seasons.some((s) => s.key === selectedSeason))
          selectedSeason = seasons.find((s) => s.current && s.league === (url.searchParams.get("league") || "Rec"))?.key || seasons[0]?.key
        const games = all
          .filter((f) => f.season === selectedSeason)
          .map((f) => {
            const rows = attendance(this.data, state, f)
            return {
              key: f.key,
              league: f.league,
              date: f.date,
              time: f.time,
              vs: f.vs,
              score: f.score,
              result: f.result,
              cancelled: f.cancelled,
              changedAt: f.changedAt,
              in: rows.filter((p) => p.status === "in").length,
              out: rows.filter((p) => p.status === "out").length,
              unknown: rows.filter((p) => p.status === "unknown").length,
            }
          })
        const response = json({
          me: actor.admin ? { admin: true, name: "Admin" } : { player: actor.player, name: players(this.data, state).find((p) => p.id === actor.player)?.name },
          enabled: this.enabled,
          seasons,
          selectedSeason,
          today: pacificDay(),
          games,
          sync: state.sync,
          players: actor.admin ? players(this.data, state).map((p) => ({ ...p, hasPin: !!this.store.auth().pins[p.id] })) : undefined,
          game: game
            ? {
                ...games.find((f) => f.key === game.key),
                attendance: attendance(this.data, state, game),
                lines: state.games[game.key]?.lines || {},
                revision: state.games[game.key]?.revision || 0,
              }
            : undefined,
        })
        const value = req.headers.get("cookie")?.match(/(?:^|;\s*)poikas_team=([^;]+)/)?.[1]
        if (value) response.headers.set("set-cookie", this.cookie(value))
        return response
      }
      if (path === "/team/api/backup" && req.method === "GET") {
        if (!actor?.admin) fail(403, "Admin login required.")
        return json(this.store.backup(), 200, { "content-disposition": `attachment; filename="poikas-private-${pacificDay()}.json"` })
      }
      if (req.method !== "POST") fail(404, "Not found.")
      if (!this.enabled) fail(503, "Team setup is in progress. Please try again soon.")
      if (req.headers.get("origin") !== this.origin || !req.headers.get("content-type")?.startsWith("application/json")) fail(403, "Please use the form on this website.")
      if (Number(req.headers.get("content-length") || 0) > (path.endsWith("/restore") ? 5e6 : 64000)) fail(413, "Request is too large.")
      const max = path.endsWith("/restore") ? 5e6 : 64000
      const reader = req.body?.getReader()
      let raw = "",
        size = 0
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > max) {
            await reader.cancel()
            fail(413, "Request is too large.")
          }
          raw += decoder.decode(value, { stream: true })
        }
        raw += decoder.decode()
      }
      let b: any
      try {
        b = JSON.parse(raw)
      } catch {
        fail(400, "Invalid request.")
      }
      if (!b || typeof b !== "object" || Array.isArray(b)) fail(400, "Invalid request.")
      if (path === "/team/api/login") {
        const player = players(this.data, state).find((p) => p.id === b.player)
        if (!player || !/^\d{3}$/.test(b.pin)) fail(400, "Choose your player and enter three digits.")
        this.attempt(ip, player.id)
        let hash = this.store.auth().pins[player.id]
        if (!hash) {
          const proposed = await Bun.password.hash(String(b.pin))
          this.store.change("auth", blankAuth, (a) => {
            hash = a.pins[player.id] ||= proposed
          })
        }
        if (!hash || !(await Bun.password.verify(String(b.pin), hash))) fail(401, "PIN not recognized. Ask the admin for a PIN setup/reset link.")
        return json({ ok: true }, 200, { "set-cookie": this.login(player.id) })
      }
      if (path === "/team/api/admin-login") {
        this.attempt(ip, "admin")
        const hash = this.store.auth().adminHash
        if (!hash || typeof b.password !== "string" || b.password.length > 200 || !(await Bun.password.verify(b.password, hash))) fail(401, "Password not recognized.")
        return json({ ok: true }, 200, { "set-cookie": this.login(undefined, true) })
      }
      if (path === "/team/api/setup") {
        if (typeof b.token !== "string" || b.token.length !== 64 || !/^\d{3}$/.test(b.pin)) fail(400, "Use your setup link and a three-digit PIN.")
        this.attempt(ip, "setup-" + digest(b.token))
        let player = ""
        const hash = Bun.password.hashSync(String(b.pin))
        this.store.change("auth", blankAuth, (a) => {
          const reset = a.resets[digest(b.token)]
          if (!reset || reset.expires < Date.now()) fail(400, "This link has expired or was already used. Ask the admin for a fresh link.")
          player = reset.player
          a.pins[player] = hash
          delete a.resets[digest(b.token)]
          for (const [k, s] of Object.entries(a.sessions)) if (s.player === player) delete a.sessions[k]
          delete a.attempts[digest("user:" + player)]
        })
        return json({ ok: true }, 200, { "set-cookie": this.login(player) })
      }
      if (!actor) fail(401, "Please sign in again.")
      if (path === "/team/api/logout") {
        const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)poikas_team=([^;]+)/)?.[1]
        if (cookie)
          this.store.change("auth", blankAuth, (a) => {
            delete a.sessions[digest(cookie)]
          })
        return json({ ok: true }, 200, { "set-cookie": `${SESSION}=; Path=/team; HttpOnly; SameSite=Lax; Max-Age=0` })
      }
      if (path === "/team/api/attendance") {
        const game = all.find((f) => f.key === b.game)
        if (!game) fail(404, "Game not found.")
        const player = actor!.admin ? b.player : actor!.player
        const row = attendance(this.data, state, game!).find((p) => p.id === player)
        if (!row) fail(400, "This player is not on this game roster. Ask the admin to add them.")
        if (!["in", "out"].includes(b.status) || typeof b.note !== "string" || b.note.length > 300) fail(400, "Choose In or Out and use a note of 300 characters or less.")
        if (row!.recorded && b.status === "out") fail(400, "Recorded game stats make this player In.")
        if (game!.cancelled) fail(400, "This game is cancelled.")
        this.store.change("state", blankState, (s) => {
          gameState(s, game!.key).attendance[player] = { status: b.status, note: b.note.trim(), updatedAt: new Date().toISOString() }
        })
        return json({ ok: true })
      }
      if (!actor!.admin) fail(403, "Admin login required.")
      if (path === "/team/api/reset-pin") {
        if (!players(this.data, state).some((p) => p.id === b.player)) fail(400, "Player not found.")
        const t = token()
        this.store.change("auth", blankAuth, (a) => {
          for (const [k, r] of Object.entries(a.resets)) if (r.player === b.player || r.expires < Date.now()) delete a.resets[k]
          a.resets[digest(t)] = { player: b.player, expires: Date.now() + 86400000 }
        })
        return json({ link: this.origin + "/team/setup#" + t })
      }
      if (path === "/team/api/admin-password") {
        if (typeof b.password !== "string" || b.password.length < 8 || b.password.length > 200) fail(400, "Use at least 8 characters.")
        const hash = Bun.password.hashSync(b.password)
        this.store.change("auth", blankAuth, (a) => {
          a.adminHash = hash
          for (const [key, s] of Object.entries(a.sessions)) if (s.admin) delete a.sessions[key]
        })
        return json({ ok: true }, 200, { "set-cookie": this.login(undefined, true) })
      }
      if (path === "/team/api/lines") {
        const game = all.find((f) => f.key === b.game)
        if (!game) fail(404, "Game not found.")
        if (!b.lines || typeof b.lines !== "object" || Array.isArray(b.lines) || Object.keys(b.lines).some((k) => !slots.has(k))) fail(400, "Invalid line positions.")
        const available = attendance(this.data, state, game!)
          .filter((p) => p.status === "in")
          .map((p) => p.id)
        const values = Object.values(b.lines)
        if (values.some((v) => typeof v !== "string" || !available.includes(v)) || new Set(values).size !== values.length)
          fail(400, "Use each checked-in player once. Refresh if attendance changed.")
        this.store.change("state", blankState, (s) => {
          const g = gameState(s, game!.key)
          if (g.revision !== b.revision) fail(409, "Lines changed on another device. Refresh before editing.")
          g.lines = b.lines
          g.revision++
        })
        return json({ ok: true })
      }
      if (path === "/team/api/add-player") {
        if (typeof b.name !== "string" || b.name.trim().length < 2 || b.name.length > 80) fail(400, "Enter a player name.")
        const game = all.find((f) => f.key === b.game)
        if (!game && !["Rec", "CC"].includes(b.league)) fail(400, "Choose a team or game.")
        const rosterSeason = this.data.seasons.find((s) => s.current && s.leagueName === b.league)
        if (!game && !rosterSeason) fail(400, "No current season is configured for this team.")
        const membership = rosterSeason ? seasonKey(rosterSeason) : ""
        const existing = players(this.data, state).find((p) => p.name.toLowerCase() === b.name.trim().toLowerCase())
        const id = existing?.id || "guest-" + token().slice(0, 12)
        this.store.change("state", blankState, (s) => {
          if (!existing) s.extraPlayers[id] = { name: b.name.trim(), teams: game ? [] : [membership] }
          else if (!game) {
            const p = (s.extraPlayers[id] ||= { name: existing.name, teams: [] })
            if (!p.teams.includes(membership)) p.teams.push(membership)
          }
          if (game) {
            const g = gameState(s, game.key)
            if (!g.guests.includes(id)) g.guests.push(id)
          }
        })
        return json({ ok: true, player: id })
      }
      if (path === "/team/api/sync") {
        await this.sync.run()
        return json({ ok: true })
      }
      if (path === "/team/api/restore") {
        if (!validBackup(b.backup)) fail(400, "This is not a valid private Poikas backup.")
        const path = join(this.store.dir, "before-restore-" + Date.now() + ".json")
        this.store.write(path, this.store.backup())
        this.store.change("state", blankState, (s) => {
          for (const k of Object.keys(s)) delete (s as any)[k]
          Object.assign(s, b.backup.state)
        })
        this.store.change("auth", blankAuth, (a) => {
          for (const k of Object.keys(a)) delete (a as any)[k]
          Object.assign(a, b.backup.auth)
          a.sessions = {}
          a.resets = {}
        })
        return json({ ok: true })
      }
      fail(404, "Not found.")
    } catch (e: any) {
      if (!(e instanceof HttpError)) console.error("Team request failed:", e.message)
      return json({ error: e instanceof HttpError ? e.message : "Unable to save right now. Please try again." }, e instanceof HttpError ? e.status : 500)
    }
  }
}
