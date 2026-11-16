import { describe, expect, test } from "bun:test"
import { getData } from "../data/load"
import { HomePage } from "../pages/HomePage"
import { AboutPage } from "../pages/AboutPage"
import { opponentRecord, pointsLeaderboard, seasonPoints } from "./homepage"
import type { Season } from "../types"

const data = getData()
const season = (league: string) => data.seasons.find(s => s.year === 2026 && s.seasonName === "Fall" && s.leagueName === league)!

describe("Homepage refresh", () => {
  test("moves history and community to About, keeps join content, and updates navigation", async () => {
    const home = await HomePage(data).text()
    const about = await AboutPage(data).text()
    expect(home).toContain('Fall/Winter 2026</h1>')
    expect(home).toContain('🏆🏆')
    expect(home).toContain('<figcaption>Two teams, two trophies: celebrating our Fall 2025 double championship.</figcaption>')
    expect(home).not.toContain("We're keeping")
    expect(home).not.toContain("Our History")
    expect(home).not.toContain("Connect with Us")
    expect(home).not.toContain("Current Rec Roster")
    expect(home).not.toContain("Current CC Roster")
    expect(home).toContain('href="/about"')
    expect(home).not.toContain('href="/join')
    expect(about).toContain("Our History")
    expect(about).toContain("Connect with Us")
    expect(about).toContain('id="join">Join the team')
    expect(about).toContain("Requirements")
    expect(about).toContain("Conduct")
    expect(about).toContain('href="/about" class="active"')
  })

  test("calculates current matchup records from completed games only", () => {
    const rec = season("Rec"), cc = season("CC")
    expect(opponentRecord(rec, rec.games!.find(g => g.result === "pending")!)).toBe("We are 1-0-1 against the Caps N Taps this season.")
    expect(opponentRecord(cc, cc.games!.find(g => g.result === "pending")!)).toBe("We are 0-1-1 against the Bandits this season.")
    const next = { vs: "Bandits", date: new Date("2026-11-22") }
    expect(opponentRecord({ ...cc, games: [{ ...next, result: "pending" }, { ...next, result: "cancelled" }] }, next)).toBe("This is our first game against the Bandits this season.")
    expect(opponentRecord({ ...cc, games: [{ ...next, result: "won", date: new Date("2026-12-01") }] }, next)).toContain("first game")
  })

  test("current top five use goals then names to break points ties without duplicate players", () => {
    const rec = pointsLeaderboard(data, season("Rec"))
    expect(rec.fallback).toBe(false)
    expect(rec.rows.map(r => [r.player.name, r.points, r.rank])).toEqual([
      ["Zacharias Snellman", 19, 1], ["Asa Storm", 12, 2], ["Myron Kinnunen", 12, 2],
      ["Levi Estola", 11, 4], ["Daniel Kulla", 10, 5],
    ])
    const cc = pointsLeaderboard(data, season("CC"))
    expect(cc.rows.map(r => [r.player.name, r.points])).toEqual([
      ["Russ Tapio", 12], ["Caleb Aring", 10], ["Kevin Sarkela", 8], ["Jared Matson", 7], ["Sam Balto", 7],
    ])
    expect(new Set(rec.rows.map(r => r.player.name)).size).toBe(rec.rows.length)
  })

  test("falls back to the immediately previous season only when no scored points exist", () => {
    const current = { ...season("Rec"), games: [], arenaReportedStats: undefined }
    const input = { ...data, seasons: data.seasons.map(s => s === season("Rec") ? current : s) }
    const board = pointsLeaderboard(input, current)
    expect(board.fallback).toBe(true)
    expect(board.season.seasonName).toBe("Summer")
    expect(board.season.year).toBe(2026)
    expect(board.rows.length).toBe(5)
    const empty = pointsLeaderboard({ ...data, seasons: [current] }, current)
    expect(empty.rows).toEqual([])
  })

  test("does not count pending/cancelled scoring or sum arena and tracked totals", () => {
    const current = season("Rec"), player = current.players![0]
    const fixture = { ...current, players: [player, player], games: [
      { vs: "Example", result: "won", stats: { [player.name]: { goals: 2, assists: 1 } } },
      { vs: "Example", result: "pending", stats: { [player.name]: { goals: 50 } } },
      { vs: "Example", result: "cancelled", stats: { [player.name]: { goals: 50 } } },
    ], arenaReportedStats: { players: [{ name: player.name, goals: 1, assists: 3 }] } } as Season
    expect(seasonPoints(fixture).map(r => [r.goals, r.assists, r.points])).toEqual([[1, 3, 4]])
    fixture.arenaReportedStats = undefined
    expect(seasonPoints(fixture)[0].points).toBe(3)
  })
})
