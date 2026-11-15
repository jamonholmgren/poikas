import { mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, fsyncSync, unlinkSync, existsSync, chmodSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { randomBytes, createHash } from "node:crypto"

export const idFor = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
export const token = () => randomBytes(32).toString("hex")
export const digest = (text: string) => createHash("sha256").update(text).digest("hex")
export type ResponseEntry = { status: "in" | "out"; note: string; updatedAt: string }
export type TeamGame = { attendance: Record<string, ResponseEntry>; guests: string[]; lines: Record<string, string>; revision: number }
export type Fixture = { id: string; key: string; league: string; season: string; date: string; time: string; vs: string; cancelled: boolean; changedAt?: string }
export type State = {
  version: 1
  updatedAt: string
  games: Record<string, TeamGame>
  extraPlayers: Record<string, { name: string; teams: string[] }>
  schedule: Fixture[]
  sync: { lastAttempt?: string; lastSuccess?: string; error?: string; day?: string }
}
export type Session = { player?: string; admin?: boolean; expires: number | null }
export type Auth = {
  version: 1
  adminHash?: string
  pins: Record<string, string>
  sessions: Record<string, Session>
  resets: Record<string, { player: string; expires: number }>
  attempts: Record<string, { count: number; until: number }>
}
export const blankState = (): State => ({ version: 1, updatedAt: new Date().toISOString(), games: {}, extraPlayers: {}, schedule: [], sync: {} })
export const blankAuth = (): Auth => ({ version: 1, pins: {}, sessions: {}, resets: {}, attempts: {} })

// One small synchronous transaction at a time. Atomic rename prevents partial JSON reads.
// The lock also protects a briefly overlapping process during deployment.
export class JsonStore {
  readonly dir: string
  constructor(dir: string) {
    this.dir = resolve(dir)
    mkdirSync(this.dir, { recursive: true, mode: 0o700 })
    chmodSync(this.dir, 0o700)
  }
  read<T>(name: "state" | "auth", initial: () => T): T {
    try {
      return JSON.parse(readFileSync(join(this.dir, name + ".json"), "utf8"))
    } catch (e: any) {
      if (e.code === "ENOENT") return initial()
      throw e
    }
  }
  change<T>(name: "state" | "auth", initial: () => T, fn: (value: T) => void): T {
    const lock = join(this.dir, name + ".lock")
    let fd: number
    try {
      fd = openSync(lock, "wx", 0o600)
    } catch (e: any) {
      if (e.code !== "EEXIST") throw e
      const contents = readFileSync(lock, "utf8").trim()
      if (!contents && Date.now() - statSync(lock).mtimeMs > 30000) {
        unlinkSync(lock)
        return this.change(name, initial, fn)
      }
      const pid = Number(contents)
      try {
        process.kill(pid, 0)
      } catch (err: any) {
        if (err.code === "ESRCH") {
          unlinkSync(lock)
          return this.change(name, initial, fn)
        }
      }
      throw new Error("Another save is in progress. Please try again.")
    }
    try {
      writeFileSync(fd, String(process.pid))
      const value: any = this.read(name, initial)
      fn(value)
      if (name === "state") value.updatedAt = new Date().toISOString()
      this.write(join(this.dir, name + ".json"), value)
      return value
    } finally {
      closeSync(fd)
      unlinkSync(lock)
    }
  }
  write(path: string, value: unknown) {
    const tmp = path + "." + token().slice(0, 12) + ".tmp"
    const fd = openSync(tmp, "wx", 0o600)
    try {
      writeFileSync(fd, JSON.stringify(value, null, 2) + "\n")
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
    renameSync(tmp, path)
    const dirFd = openSync(resolve(path, ".."), "r")
    try {
      fsyncSync(dirFd)
    } finally {
      closeSync(dirFd)
    }
  }
  state() {
    return this.read("state", blankState)
  }
  auth() {
    return this.read("auth", blankAuth)
  }
  backup() {
    return { format: "poikas-private-v1", savedAt: new Date().toISOString(), state: this.state(), auth: this.auth() }
  }
  dailyBackup() {
    const dir = join(this.dir, "backups")
    mkdirSync(dir, { recursive: true, mode: 0o700 })
    const path = join(dir, new Date().toISOString().slice(0, 10) + ".json")
    if (!existsSync(path)) this.write(path, this.backup())
    for (const file of readdirSync(dir)
      .filter((x) => /^\d{4}-\d{2}-\d{2}\.json$/.test(x))
      .sort()
      .slice(0, -30))
      unlinkSync(join(dir, file))
  }
}
export const gameState = (state: State, key: string) => (state.games[key] ||= { attendance: {}, guests: [], lines: {}, revision: 0 })
export function validBackup(b: any): boolean {
  if (b?.format !== "poikas-private-v1" || b.state?.version !== 1 || b.auth?.version !== 1) return false
  const record = (v: any) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((k) => /^[a-zA-Z0-9_-]{1,160}$/.test(k))
  if (![b.state.games, b.state.extraPlayers, b.auth.pins, b.auth.sessions, b.auth.resets, b.auth.attempts].every(record) || !Array.isArray(b.state.schedule) || !b.state.sync)
    return false
  if (b.auth.adminHash && typeof b.auth.adminHash !== "string") return false
  for (const g of Object.values(b.state.games) as any[]) {
    if (!record(g.attendance) || !record(g.lines) || !Array.isArray(g.guests) || !Number.isInteger(g.revision)) return false
    if (!Object.values(g.attendance).every((a: any) => ["in", "out"].includes(a.status) && typeof a.note === "string" && a.note.length <= 300 && typeof a.updatedAt === "string"))
      return false
    if (![...g.guests, ...Object.values(g.lines)].every((v) => typeof v === "string" && /^[a-z0-9-]{1,100}$/.test(v))) return false
  }
  for (const p of Object.values(b.state.extraPlayers) as any[])
    if (typeof p.name !== "string" || p.name.length > 80 || !Array.isArray(p.teams) || !p.teams.every((t: string) => /^\d{4}-(spring|summer|fall)-(rec|cc)$/.test(t))) return false
  if (!Object.values(b.auth.pins).every((v) => typeof v === "string" && v.startsWith("$"))) return false
  if (!Object.values(b.auth.sessions).every((v: any) => (v.expires === null || Number.isFinite(v.expires)) && (v.admin === true || typeof v.player === "string"))) return false
  if (!Object.values(b.auth.resets).every((v: any) => Number.isFinite(v.expires) && typeof v.player === "string")) return false
  if (!Object.values(b.auth.attempts).every((v: any) => Number.isFinite(v.until) && Number.isInteger(v.count))) return false
  return b.state.schedule.every(
    (f: any) =>
      typeof f.id === "string" &&
      /^\d+$/.test(f.id) &&
      typeof f.key === "string" &&
      /^[a-z0-9-]+$/.test(f.key) &&
      ["Rec", "CC"].includes(f.league) &&
      typeof f.season === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(f.date) &&
      typeof f.vs === "string" &&
      typeof f.time === "string" &&
      typeof f.cancelled === "boolean",
  )
}
