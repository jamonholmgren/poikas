import { expect, test, describe } from "bun:test"
import { getData } from "../data/load"
import { LeaguePage } from "./LeaguePage"
import { PlayerPage } from "./PlayerPage"
import { AllPlayersPage } from "./AllPlayersPage"

const data = getData()

async function html(res: Response | unknown) {
  if (!(res instanceof Response)) throw new Error("expected Response")
  return await res.text()
}

describe("LeaguePage", () => {
  test("renders the Spring 2026 Rec season", async () => {
    const season = data.seasons.find((s) => s.year === 2026 && s.seasonName === "Spring" && s.leagueName === "Rec")!
    expect(season).toBeDefined()
    const slug = season.url.split("/").slice(2).join("/")
    const page = await html(LeaguePage(data, slug))

    expect(page).toContain("2026 Spring Rec")
    expect(page).toContain("Liquid Gold")
    expect(page).toContain("Thundersticks")
    // PIM column header
    expect(page).toContain(">PIM<")
    expect(page).toContain("Penalty minutes")
    // Pending stub games show as Upcoming
    expect(page).toContain("Upcoming")
    // A known roster member should appear
    expect(page).toContain("Jayden Matson")
  })

  test("renders the Spring 2026 CC season", async () => {
    const season = data.seasons.find((s) => s.year === 2026 && s.seasonName === "Spring" && s.leagueName === "CC")!
    expect(season).toBeDefined()
    const slug = season.url.split("/").slice(2).join("/")
    const page = await html(LeaguePage(data, slug))

    expect(page).toContain("2026 Spring CC")
    expect(page).toContain("Revolution")
    expect(page).toContain("CCCP")
    expect(page).toContain("Kyle Malstrom")
  })

  test("returns 404 response for unknown slug", () => {
    const res = LeaguePage(data, "not-a-real-slug")
    expect(res).toBeInstanceOf(Response)
    expect((res as Response).status).toBe(404)
  })
})

describe("PlayerPage", () => {
  test("renders Joel Mattila's profile with career stats and PIM", async () => {
    const joel = data.players.find((p) => p.name === "Joel Mattila")!
    expect(joel).toBeDefined()
    const page = await html(PlayerPage(data, joel.slug))

    expect(page).toContain("Joel Mattila")
    expect(page).toContain("Career Goals")
    expect(page).toContain("Career PIM")
    // Season stats table header
    expect(page).toContain(">PIM<")
  })

  test("renders goalie-specific columns for Jamon Holmgren", async () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    expect(jamon).toBeDefined()
    const page = await html(PlayerPage(data, jamon.slug))

    expect(page).toContain("Jamon Holmgren")
    // goalie columns
    expect(page).toContain("GAA")
    expect(page).toContain("SV%")
  })

  test("returns 404 for unknown player slug", () => {
    const res = PlayerPage(data, "no-such-player")
    expect(res).toBeInstanceOf(Response)
    expect((res as Response).status).toBe(404)
  })
})

describe("AllPlayersPage", () => {
  test("renders the all-players table with PIM column", async () => {
    const page = await html(AllPlayersPage(data))

    expect(page).toContain("All Players")
    expect(page).toContain(">PIM<")
    expect(page).toContain("Career penalty minutes")
    // Includes at least one well-known player
    expect(page).toContain("Joel Mattila")
    // Total player count rendered in stats card
    expect(page).toMatch(/<span class="stat-number">\d+<\/span>/)
  })
})
