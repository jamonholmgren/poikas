import { test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { TeamApp } from "./app"
import { getData } from "../data/load"
import { blankAuth, blankState, gameState, validBackup, digest, JsonStore } from "./store"
import { fixtures, attendance } from "./games"
import { parseSchedule } from "./schedule"
const origin = "http://localhost:5151"
const data = getData()
const hash = Bun.password.hashSync("test-admin-long-password")
let dir: string, app: TeamApp
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "poikas-team-test-"))
  app = new TeamApp(data, { dir, enabled: true, origin })
  app.store.change("auth", blankAuth, (a) => {
    a.adminHash = hash
  })
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))
const req = (path: string, body?: any, cookie = "", extra: Record<string, string> = {}) =>
  app.handle(
    new Request(origin + "/team/api/" + path, {
      method: body ? "POST" : "GET",
      headers: { origin, "content-type": "application/json", cookie, ...extra },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    "test-client",
  )
async function admin() {
  const r = await req("admin-login", { password: "test-admin-long-password" })
  expect(r.status).toBe(200)
  return r.headers.get("set-cookie")!.split(";")[0]
}
async function player(id = "jamon-holmgren") {
  app.store.change("auth", blankAuth, (a) => {
    a.pins[id] = Bun.password.hashSync("123")
  })
  const r = await req("login", { player: id, pin: "123" })
  expect(r.status).toBe(200)
  return r.headers.get("set-cookie")!.split(";")[0]
}
const future = () => fixtures(data, app.store.state()).find((g) => g.league === "Rec" && g.date === "2026-11-21")!
const past = () => fixtures(data, app.store.state()).find((g) => g.league === "Rec" && g.date === "2026-11-14")!

test("unauthenticated routes never expose attendance notes, lines, credentials or backups", async () => {
  app.store.change("state", blankState, (s) => {
    gameState(s, future().key).attendance["jamon-holmgren"] = { status: "out", note: "private note", updatedAt: "now" }
  })
  const r = await req("state?game=" + future().key)
  const text = await r.text()
  expect(text).not.toContain("private note")
  expect(text).not.toContain("attendance")
  expect(text).not.toContain(hash)
  expect((await req("backup")).status).toBe(403)
  const shell = await app.handle(new Request(origin + "/team/setup"))
  expect(await shell.text()).not.toContain(hash)
  expect(shell.headers.get("content-security-policy")).toContain("frame-ancestors 'none'")
})
test("PIN setup is admin-issued, one-use, revokes old sessions, and only stores hashes", async () => {
  const a = await admin(),
    old = await player()
  const r = await req("reset-pin", { player: "jamon-holmgren" }, a),
    { link } = await r.json()
  const t = link.split("#")[1]
  expect(readFileSync(join(dir, "auth.json"), "utf8")).not.toContain(t)
  expect((await req("setup", { token: t, pin: "456" })).status).toBe(200)
  expect((await req("setup", { token: t, pin: "456" })).status).toBe(400)
  expect((await (await req("state", undefined, old)).json()).me).toBeNull()
  expect(await Bun.password.verify("456", app.store.auth().pins["jamon-holmgren"])).toBe(true)
})
test("expired setup links cannot reset a PIN", async () => {
  app.store.change("auth", blankAuth, (a) => {
    a.resets[digest("a".repeat(64))] = { player: "jamon-holmgren", expires: 0 }
  })
  expect((await req("setup", { token: "a".repeat(64), pin: "456" })).status).toBe(400)
})
test("PIN attempts are limited per player and remain limited after restart", async () => {
  for (let i = 0; i < 6; i++) expect((await req("login", { player: "jamon-holmgren", pin: "999" })).status).toBe(401)
  app = new TeamApp(data, { dir, enabled: true, origin })
  expect((await req("login", { player: "jamon-holmgren", pin: "999" })).status).toBe(429)
})
test("admin login is also rate limited", async () => {
  for (let i = 0; i < 8; i++) expect((await req("admin-login", { password: "wrong" })).status).toBe(401)
  expect((await req("admin-login", { password: "test-admin-long-password" })).status).toBe(429)
})
test("cross-origin writes and player impersonation are prevented", async () => {
  const p = await player()
  expect((await req("attendance", { game: future().key, status: "in", note: "" }, p, { origin: "https://other.example" })).status).toBe(403)
  await req("attendance", { game: future().key, player: "peter-tapio", status: "in", note: "my note" }, p)
  expect(app.store.state().games[future().key].attendance["jamon-holmgren"].status).toBe("in")
  expect(app.store.state().games[future().key].attendance["peter-tapio"]).toBeUndefined()
  expect((await req("reset-pin", { player: "peter-tapio" }, p)).status).toBe(403)
})
test("In/Out and private notes survive a new server instance and atomic saves", async () => {
  const p = await player()
  await req("attendance", { game: future().key, status: "out", note: "Running late" }, p)
  app = new TeamApp(data, { dir, enabled: true, origin })
  const s = await (await req("state?game=" + future().key, undefined, p)).json()
  expect(s.game.attendance.find((x: any) => x.id === "jamon-holmgren")).toMatchObject({ status: "out", note: "Running late" })
  expect(JSON.parse(readFileSync(join(dir, "state.json"), "utf8")).version).toBe(1)
})
test("past games use the same record and recorded stats force In over an old Out", async () => {
  const p = await player("peter-tapio"),
    key = past().key
  app.store.change("state", blankState, (s) => {
    gameState(s, key).attendance["peter-tapio"] = { status: "out", note: "original note", updatedAt: "now" }
  })
  expect(attendance(data, app.store.state(), past()).find((p) => p.id === "peter-tapio")?.status).toBe("in")
  expect((await req("attendance", { game: key, status: "out", note: "" }, p)).status).toBe(400)
  expect((await req("attendance", { game: key, status: "in", note: "Played" }, p)).status).toBe(200)
})
test("players without recorded stats can mark a past game Out", async () => {
  const p = await player("brenna-matson")
  expect((await req("attendance", { game: past().key, status: "out", note: "Missed this one" }, p)).status).toBe(200)
})
test("admin can add a one-game fill-in without adding them to both rosters", async () => {
  const a = await admin()
  const r = await req("add-player", { game: future().key, name: "Test Fill In" }, a)
  const { player: id } = await r.json()
  expect(attendance(data, app.store.state(), future()).some((p) => p.id === id)).toBe(true)
  expect(attendance(data, app.store.state(), past()).some((p) => p.id === id)).toBe(false)
  expect((await req("attendance", { game: future().key, player: id, status: "in", note: "" }, a)).status).toBe(200)
})
test("adding an existing canonical player to another roster never duplicates identity", async () => {
  const a = await admin()
  await req("add-player", { league: "CC", name: "Peter Tapio" }, a)
  const s = await (await req("state", undefined, a)).json()
  expect(s.players.filter((p: any) => p.id === "peter-tapio")).toHaveLength(1)
})
test("lines require admin, available players, unique positions, and detect concurrent edits", async () => {
  const a = await admin(),
    p = await player()
  await req("attendance", { game: future().key, status: "in", note: "" }, p)
  const body = { game: future().key, lines: { G: "jamon-holmgren" }, revision: 0 }
  expect((await req("lines", body, p)).status).toBe(403)
  expect((await req("lines", body, a)).status).toBe(200)
  expect((await req("lines", body, a)).status).toBe(409)
  expect((await req("lines", { ...body, revision: 1, lines: { G: "jamon-holmgren", "F1-C": "jamon-holmgren" } }, a)).status).toBe(400)
})
test("private backups restore state, invalidate sessions, and reject malformed backups", async () => {
  const a = await admin()
  const backup = await (await req("backup", undefined, a)).json()
  expect(validBackup(backup)).toBe(true)
  expect(validBackup({ ...backup, state: { ...backup.state, games: { oops: {} } } })).toBe(false)
  expect((await req("restore", { backup: { oops: true } }, a)).status).toBe(400)
  app.store.change("state", blankState, (s) => {
    s.extraPlayers.test = { name: "Test User", teams: ["2026-fall-rec"] }
  })
  expect((await req("restore", { backup }, a)).status).toBe(200)
  expect(app.store.state().extraPlayers.test).toBeUndefined()
  expect((await (await req("state", undefined, a)).json()).me).toBeNull()
})
test("live writes stay disabled until persistent hosting is configured", async () => {
  app = new TeamApp(data, { dir, enabled: false, origin })
  expect((await req("admin-login", { password: "test-admin-long-password" })).status).toBe(503)
})
const html = (date = "11/21/2026", time = "10:30 PM") =>
  `<table><tr><td data-th="Date"><a href="../../schedule.aspx?facility_id=2042&amp;d=${date}">Date</a></td><td data-th="Home"><a>Suomi Poikas</a></td><td data-th="Away"><a>Caps N Taps</a></td><td data-th="Time/Status"><a href="../../games/99901/game.aspx">${time}</a></td></tr><tr><td data-th="Date"><a href="?d=12/5/2026">Date</a></td><td data-th="Home">Suomi Poikas</td><td data-th="Away">Pinecones</td><td data-th="Time/Status"><a href="/games/99902/game.aspx">9:00 PM</a></td></tr></table>`
test("MVIA parser reads game identity, Pacific date/time and refuses broken HTML", () => {
  expect(parseSchedule(html(), "Rec", "2026-fall-rec")[0]).toMatchObject({ id: "99901", date: "2026-11-21", time: "10:30 PM", vs: "Caps N Taps" })
  expect(() => parseSchedule("<html>broken</html>", "Rec", "x")).toThrow()
})
test("rescheduling preserves check-ins, lines and original game links", async () => {
  const original = globalThis.fetch
  try {
    let moved = false
    globalThis.fetch = (async () => new Response(html(moved ? "11/22/2026" : "11/21/2026", moved ? "9:00 PM" : "10:30 PM"))) as typeof fetch
    const key = future().key
    // Test with only the current Rec source; parser results for CC are irrelevant here.
    const subset = { ...data, seasons: data.seasons.filter((s) => s.leagueName === "Rec") } as typeof data
    const { ScheduleSync } = await import("./schedule")
    const sync = new ScheduleSync(app.store, subset)
    await sync.run()
    app.store.change("state", blankState, (s) => {
      gameState(s, key).attendance["jamon-holmgren"] = { status: "in", note: "Same game", updatedAt: "now" }
      gameState(s, key).lines = { G: "jamon-holmgren" }
    })
    moved = true
    await sync.run()
    const f = fixtures(subset, app.store.state()).find((f) => f.key === key)!
    expect(f.date).toBe("2026-11-22")
    expect(f.time).toBe("9:00 PM")
    expect(f.changedAt).toBeTruthy()
    expect(app.store.state().games[key].lines.G).toBe("jamon-holmgren")
    expect(app.store.state().games[key].attendance["jamon-holmgren"].note).toBe("Same game")
  } finally {
    globalThis.fetch = original
  }
})
test("daily JSON backup remains valid and private on disk", () => {
  app.store.dailyBackup()
  const b = JSON.parse(readFileSync(join(dir, "backups", new Date().toISOString().slice(0, 10) + ".json"), "utf8"))
  expect(validBackup(b)).toBe(true)
})
