import { expect, test, describe } from "bun:test"
import { getData } from "../data/load"
import { LeaguePage } from "./LeaguePage"
import { PlayerPage } from "./PlayerPage"
import { AllPlayersPage } from "./AllPlayersPage"
import { HomePage, upcomingPendingGames } from "./HomePage"

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
    expect(page).toContain("lost 4-5")
    expect(page).toContain("Championship game")
    // A known roster member should appear
    expect(page).toContain("Jayden Matson")
  })

  test("renders the Fall 2026 Rec season and its Sep. 12 game", async () => {
    const season = data.seasons.find((s) => s.year === 2026 && s.seasonName === "Fall" && s.leagueName === "Rec")!
    expect(season).toBeDefined()
    const slug = season.url.split("/").slice(2).join("/")
    const page = await html(LeaguePage(data, slug))

    expect(page).toContain("2026 Fall Rec")
    expect(page).toContain("won 5-0")
    expect(page).toContain("Caps N Taps")
    expect(page).toContain("Brenna Matson's first game as a Poika.")
    expect(page).toContain('<span class="stat-number">100.0%</span>')
    expect(page).toContain("Upcoming")
    expect(page).toContain("9/12/2026")
  })

  test("renders the Summer 2026 Rec exhibition series", async () => {
    const season = data.seasons.find((s) => s.year === 2026 && s.seasonName === "Summer" && s.leagueName === "Rec")!
    expect(season).toBeDefined()
    const slug = season.url.split("/").slice(2).join("/")
    const page = await html(LeaguePage(data, slug))

    expect(page).toContain("2026 Summer Rec")
    expect(page).toContain("won 6-1")
    expect(page).toContain("Reported as a 3-6 loss.")
    expect(page).toContain("<td>lost 3-6</td>")
  })

  test("renders the Fall 2026 CC season and its Sep. 13 game", async () => {
    const season = data.seasons.find((s) => s.year === 2026 && s.seasonName === "Fall" && s.leagueName === "CC")!
    expect(season).toBeDefined()
    const slug = season.url.split("/").slice(2).join("/")
    const page = await html(LeaguePage(data, slug))

    expect(page).toContain("2026 Fall CC")
    expect(page).toContain("won 3-2")
    expect(page).toContain("Brian")
    expect(page).toContain("Upcoming")
    expect(page).toContain("9/13/2026")
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

describe("HomePage", () => {
  test("shows a 100% win rate for the undefeated Fall Rec team", async () => {
    const page = await html(HomePage(data))

    expect(page).toContain("2026 Fall Rec")
    expect(page).toContain('<span class="mini-stat-number">100.0%</span>')
  })

  test("skips pending games from before today", () => {
    const games = [
      { vs: "Old Pending", result: "pending" as const, date: new Date("2026-04-26") },
      { vs: "Today Pending", result: "pending" as const, date: new Date("2026-04-28") },
      { vs: "Future Pending", result: "pending" as const, date: new Date("2026-05-03") },
      { vs: "Finished", result: "won" as const, date: new Date("2026-05-10") },
    ]

    expect(upcomingPendingGames(games, new Date("2026-04-28T12:00:00-07:00")).map((g) => g.vs)).toEqual(["Today Pending", "Future Pending"])
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

  test("renders goalie career stats for goalie player pages", async () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const page = await html(PlayerPage(data, jamon.slug))

    expect(page).toContain("<th>Career GP</th>")
    expect(page).toContain("<th>Career WLT</th>")
    expect(page).toContain("<th>Career SV%</th>")
    expect(page).toContain("<th>Career SA/G</th>")
    expect(page).toContain("<th>Skater G-A-P</th>")
    expect(page).not.toContain("<th>Career Goals</th>")
  })

  test("counts Jamon's three Fall 2026 Rec starts", () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const fall2026 = jamon.seasons.Rec.find((s) => s.year === 2026 && s.seasonName === "Fall")!

    expect(fall2026.season.wins).toBe(4)
    expect(fall2026.stats.goalieGamesPlayed).toBe(3)
    expect(fall2026.stats.goalieRecord).toBe("3-0-0")
  })

  test("renders Rec, CC, and Career aggregate rows for goalie player pages", async () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const page = await html(PlayerPage(data, jamon.slug))
    const careerTable = page.slice(page.indexOf("<h3>Career League Seasons</h3>"))

    expect(careerTable).toMatch(/<td>Rec<\/td>[\s\S]*?<td>90\.1%<\/td>[\s\S]*?<td>17\.5<\/td>/)
    expect(careerTable).toMatch(/<td>CC<\/td>[\s\S]*?<td>83\.9%<\/td>[\s\S]*?<td>30\.0<\/td>/)
    expect(careerTable).toMatch(/<td>Career<\/td>[\s\S]*?<td>87\.3%<\/td>[\s\S]*?<td>21\.6<\/td>/)
  })

  test("keeps skater career stats for non-goalie player pages", async () => {
    const joel = data.players.find((p) => p.name === "Joel Mattila")!
    const page = await html(PlayerPage(data, joel.slug))

    expect(page).toContain("<th>Career Goals</th>")
    expect(page).not.toContain("<th>Career GP</th>")
  })

  test("renders Rec, CC, and Career aggregate rows for skater player pages", async () => {
    const joel = data.players.find((p) => p.name === "Joel Mattila")!
    const page = await html(PlayerPage(data, joel.slug))
    const careerTable = page.slice(page.indexOf("<h3>Career League Seasons</h3>"))

    expect(careerTable).toMatch(/<td>Rec<\/td>[\s\S]*?<td>56<\/td>[\s\S]*?<td>58<\/td>[\s\S]*?<td>114<\/td>/)
    expect(careerTable).toMatch(/<td>CC<\/td>[\s\S]*?<td>13<\/td>[\s\S]*?<td>13<\/td>[\s\S]*?<td>26<\/td>/)
    expect(careerTable).toMatch(/<td>Career<\/td>[\s\S]*?<td>69<\/td>[\s\S]*?<td>71<\/td>[\s\S]*?<td>140<\/td>/)
  })

  test("uses arena goalie stats when game shot counts are missing", () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const spring2023 = jamon.seasons.Rec.find((s) => s.year === 2023 && s.seasonName === "Spring")!
    expect(spring2023.stats.savePercentageFormatted).toBe("86.2%")
    expect(spring2023.stats.averageShotsAgainstFormatted).toBe("20.3")
    expect(spring2023.arenaGoalieSeasonStats?.save_percentage).toBe(0.862)
  })

  test("uses arena goalie stats for older Rec and CC seasons", () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!

    const recFall2021 = jamon.seasons.Rec.find((s) => s.year === 2021 && s.seasonName === "Fall")!
    expect(recFall2021.stats.savePercentageFormatted).toBe("90.2%")
    expect(recFall2021.stats.averageShotsAgainstFormatted).toBe("16.1")

    const ccFall2021 = jamon.seasons.CC.find((s) => s.year === 2021 && s.seasonName === "Fall")!
    expect(ccFall2021.stats.savePercentageFormatted).toBe("81.9%")
    expect(ccFall2021.stats.averageShotsAgainstFormatted).toBe("30.2")

    const ccSpring2022 = jamon.seasons.CC.find((s) => s.year === 2022 && s.seasonName === "Spring")!
    expect(ccSpring2022.stats.savePercentageFormatted).toBe("84.5%")
    expect(ccSpring2022.stats.averageShotsAgainstFormatted).toBe("27.4")
  })

  test("uses MVIA's Spring 2026 CC goalie totals", () => {
    const kyle = data.players.find((p) => p.name === "Kyle Malstrom")!
    const spring2026 = kyle.seasons.CC.find((s) => s.year === 2026 && s.seasonName === "Spring")!

    expect(spring2026.stats.goalieGamesPlayed).toBe(10)
    expect(spring2026.stats.goalieRecord).toBe("7-2-1")
    expect(spring2026.stats.savePercentageFormatted).toBe("89.9%")
    expect(spring2026.stats.shutouts).toBe(1)
    expect(spring2026.arenaGoalieSeasonStats?.name).toBe("Kyle Malstrom")
  })

  test("keeps Fall 2022 CC goalie stats with Erik Benton", () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const jamonFall2022 = jamon.seasons.CC.find((s) => s.year === 2022 && s.seasonName === "Fall")
    expect(jamonFall2022).toBeUndefined()

    const erik = data.players.find((p) => p.name === "Erik Benton")!
    const erikFall2022 = erik.seasons.CC.find((s) => s.year === 2022 && s.seasonName === "Fall")!
    expect(erikFall2022.stats.savePercentageFormatted).toBe("86.9%")
    expect(`${erikFall2022.arenaGoalieSeasonStats?.name} ${erikFall2022.arenaGoalieSeasonStats?.number}`).toContain("Erik Benton")
  })

  test("does not render fake goalie percentages for ignored seasons", async () => {
    const jamon = data.players.find((p) => p.name === "Jamon Holmgren")!
    const page = await html(PlayerPage(data, jamon.slug))

    expect(page).toMatch(/Rec 2020 Spring[\s\S]*?<td>1<\/td>\s*<td>1-0-0<\/td>\s*<td>-<\/td>\s*<td>-<\/td>\s*<td>-<\/td>/)
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
