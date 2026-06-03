import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { poikasData } from "../poikas"
import type { ArenaGoalieSeasonStats, ArenaPlayerSeasonStats, ArenaSeasonStats, ArenaTeamStanding, LeagueName, SeasonName, SeasonRaw } from "../../types"

type ManifestEntry = {
  year: number
  seasonName: SeasonName
  leagueName: LeagueName
  teamName: string
  teamId: number
  teamUrl: string
  discoveredFromDate?: string
  htmlPath: string
}

type Manifest = {
  seasons: ManifestEntry[]
}

type CliOptions = {
  write: boolean
  writeJson: boolean
}

const baseUrl = "https://mountainview.ezleagues.ezfacility.com"
const archiveDir = path.join(import.meta.dir, "ezfacility")
const schedulesDir = path.join(archiveDir, "schedules")
const teamsDir = path.join(archiveDir, "teams")
const manifestPath = path.join(archiveDir, "manifest.json")

export function parseTeamHtml(html: string, sourceUrl = "", expected?: Pick<ManifestEntry, "year" | "seasonName" | "leagueName">): ArenaSeasonStats {
  const header = textFromHtml(html.match(/<span>\s*([^<]*League Standings)\s*<\/span>/i)?.[1] || "")
  const info = parseSeasonHeader(header, expected)

  return {
    ...info,
    source_url: sourceUrl,
    standings: parseStandings(html),
    players: parsePlayerStats(html),
    goalies: parseGoalieStats(html),
  }
}

export function parseScheduleHtml(html: string): { teamName: string; href: string }[] {
  return extractLinks(html)
    .filter((link) => /suomi/i.test(link.text) && /(^|\/)teams\/\d+\//.test(link.href))
    .map((link) => ({ teamName: link.text, href: link.href }))
}

function parseStandings(html: string): ArenaTeamStanding[] {
  return extractTableRows(html, "gvStandings")
    .slice(1)
    .filter((cells) => cells.length >= 10)
    .map((cells) => ({
      team_name: cells[0],
      points: numberValue(cells[1]),
      wins: numberValue(cells[2]),
      losses: numberValue(cells[3]),
      ties: numberValue(cells[4]),
      games_played: numberValue(cells[5]),
      otl: numberValue(cells[6]),
      goals_for: numberValue(cells[7]),
      goals_against: numberValue(cells[8]),
      goal_differential: numberValue(cells[9]),
    }))
}

function parsePlayerStats(html: string): ArenaPlayerSeasonStats[] {
  return extractTableRows(html, "ctl00_C_gvStats0")
    .slice(1)
    .filter((cells) => cells.length >= 8)
    .map((cells) => ({
      name: cells[1],
      number: cells[2],
      games_played: numberValue(cells[3]),
      goals: numberValue(cells[4]),
      assists: numberValue(cells[5]),
      points: numberValue(cells[6]),
      penalty_minutes: numberValue(cells[7]),
    }))
}

function parseGoalieStats(html: string): ArenaGoalieSeasonStats[] {
  return extractTableRows(html, "ctl00_C_gvStats1")
    .slice(1)
    .filter((cells) => cells.length >= 12)
    .map((cells) => ({
      name: goalieName(cells[1]),
      number: goalieNumber(cells[1], cells[2]),
      games_played: numberValue(cells[3]),
      wins: numberValue(cells[4]),
      losses: numberValue(cells[5]),
      ot_losses: numberValue(cells[6]),
      saves: numberValue(cells[7]),
      goals_against: numberValue(cells[8]),
      gaa: numberValue(cells[9]),
      save_percentage: numberValue(cells[10]),
      shutouts: numberValue(cells[11]),
    }))
}

function goalieName(name: string): string {
  const parts = name.split(" ")
  if (parts.length === 2) return parts[0]
  return name
}

function goalieNumber(name: string, number: string): string {
  const parts = name.split(" ")
  if (parts.length === 2 && number.toUpperCase() === "G") return `${parts[1]} ${number}`
  return number
}

function extractTableRows(html: string, tableId: string): string[][] {
  const table = html.match(new RegExp(`<table\\b[^>]*id=["']${escapeRegExp(tableId)}["'][\\s\\S]*?<\\/table>`, "i"))?.[0]
  if (!table) return []

  return Array.from(table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((row) =>
    Array.from(row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)).map((cell) => textFromHtml(cell[1])),
  )
}

function extractLinks(html: string): { href: string; text: string }[] {
  return Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)).map((match) => ({
    href: match[1],
    text: textFromHtml(match[2]),
  }))
}

function textFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function parseSeasonHeader(header: string, expected?: Pick<ManifestEntry, "year" | "seasonName" | "leagueName">): Pick<ArenaSeasonStats, "year" | "season" | "league"> {
  const match = header.match(/\b(Spring|Summer|Fall|Fall\/Winter)\s+(20\d{2})(?:\s*-\s*(?:Adult\s+)?(?:League\s+)?(Rec|C|CC|CC\/C)\s+League|\s+(Rec|C|CC|CC\/C)\s+League)/i)
  if (!match && expected) {
    return {
      year: expected.year,
      season: expected.seasonName,
      league: expected.leagueName === "Rec" ? "Rec" : "C",
    }
  }
  if (!match) throw new Error(`Could not parse EZFacility season header: ${header}`)
  const league = normalizeArenaLeague(match[3] || match[4])
  return {
    year: numberValue(match[2]),
    season: match[1] === "Fall/Winter" ? "Fall" : match[1],
    league,
  }
}

function normalizeArenaLeague(league: string): string {
  if (/rec/i.test(league)) return "Rec"
  return "C"
}

function numberValue(value: string): number {
  return Number(value.replace(/[^\d.-]/g, "")) || 0
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function run() {
  const [command, ...args] = Bun.argv.slice(2)
  const options = parseOptions(args)

  if (command === "discover") {
    const manifest = await discover(options)
    await writeManifest(manifest)
    console.log(`Discovered ${manifest.seasons.length} EZFacility team pages`)
    return
  }

  if (command === "fetch") {
    const manifest = await loadManifest()
    await fetchTeams(manifest, options)
    return
  }

  if (command === "parse") {
    const manifest = await loadManifest()
    const parsed = await parseArchivedTeams(manifest)
    if (options.writeJson) await writeArenaJson(parsed)
    console.log(`Parsed ${parsed.length} archived EZFacility team pages`)
    return
  }

  if (command === "regen") {
    const manifest = await discover({ write: true, writeJson: false })
    await writeManifest(manifest)
    await fetchTeams(manifest, { write: true, writeJson: false })
    const parsed = await parseArchivedTeams(manifest)
    await writeArenaJson(parsed)
    console.log(`Regenerated historical JSON from ${parsed.length} archived team pages`)
    return
  }

  console.log("Usage: bun run src/data/historical/ezfacility.ts <discover|fetch|parse|regen> [--write] [--write-json]")
}

function parseOptions(args: string[]): CliOptions {
  return {
    write: args.includes("--write"),
    writeJson: args.includes("--write-json"),
  }
}

async function discover(options: CliOptions): Promise<Manifest> {
  const manifest = await loadManifest()
  seedManifestFromSeasonSchedules(manifest)

  for (const season of poikasData.seasons) {
    if (season.year === 2020 && season.seasonName === "Spring" && season.leagueName === "Rec") continue
    if (findManifestEntry(manifest, season)) continue

    const entry = await discoverSeason(season, options)
    if (entry) upsertManifestEntry(manifest, entry)
  }

  return sortManifest(manifest)
}

async function discoverSeason(season: SeasonRaw, options: CliOptions): Promise<ManifestEntry | undefined> {
  for (const date of discoveryDates(season)) {
    const ymd = formatYmd(date)
    const htmlPath = path.join("schedules", `${ymd}.html`)
    const fullHtmlPath = path.join(archiveDir, htmlPath)
    const html = options.write ? await fetchOrRead(scheduleUrl(date), fullHtmlPath) : await fetchText(scheduleUrl(date))

    const match = parseScheduleHtml(html).find((candidate) => teamLinkMatchesSeason(candidate, season))
    if (!match) continue

    const teamUrl = absoluteTeamUrl(match.href)
    const teamHtml = await fetchText(teamUrl)
    const teamInfo = parseTeamHeader(teamHtml)
    if (!teamInfo || !parsedSeasonMatches(teamInfo, season)) continue
    if (options.write) await writeText(fullHtmlPath, html)

    return {
      year: season.year,
      seasonName: season.seasonName,
      leagueName: season.leagueName,
      teamName: match.teamName,
      teamId: teamIdFromUrl(teamUrl),
      teamUrl,
      discoveredFromDate: ymd,
      htmlPath: teamArchivePath(season, teamUrl),
    }
  }

  return undefined
}

function parseTeamHeader(html: string): Pick<ArenaSeasonStats, "year" | "season" | "league"> | undefined {
  const header = textFromHtml(html.match(/<span>\s*([^<]*League Standings)\s*<\/span>/i)?.[1] || "")
  try {
    return parseSeasonHeader(header)
  } catch {
    return undefined
  }
}

function parsedSeasonMatches(parsed: Pick<ArenaSeasonStats, "year" | "season" | "league">, season: SeasonRaw): boolean {
  return parsed.year === season.year && parsed.season === season.seasonName && (parsed.league === season.leagueName || (parsed.league === "C" && season.leagueName === "CC"))
}

function seedManifestFromSeasonSchedules(manifest: Manifest) {
  for (const season of poikasData.seasons) {
    if (!season.schedule || !season.schedule.includes("/teams/")) continue
    upsertManifestEntry(manifest, {
      year: season.year,
      seasonName: season.seasonName,
      leagueName: season.leagueName,
      teamName: `Suomi Poikas ${season.leagueName}`,
      teamId: teamIdFromUrl(season.schedule),
      teamUrl: normalizeTeamUrl(season.schedule),
      htmlPath: teamArchivePath(season, season.schedule),
    })
  }
}

async function fetchTeams(manifest: Manifest, options: CliOptions) {
  for (const entry of manifest.seasons) {
    const fullPath = path.join(archiveDir, entry.htmlPath)
    const html = await fetchOrRead(entry.teamUrl, fullPath)
    if (options.write) await writeText(fullPath, html)
    console.log(`${options.write ? "Archived" : "Fetched"} ${entry.year} ${entry.seasonName} ${entry.leagueName}: ${entry.teamUrl}`)
  }
}

async function parseArchivedTeams(manifest: Manifest): Promise<ArenaSeasonStats[]> {
  const seasons: ArenaSeasonStats[] = []
  for (const entry of manifest.seasons) {
    const html = await readFile(path.join(archiveDir, entry.htmlPath), "utf8")
    seasons.push(parseTeamHtml(html, entry.teamUrl, entry))
  }
  return seasons
}

async function writeArenaJson(seasons: ArenaSeasonStats[]) {
  const rec: Record<string, ArenaSeasonStats> = {}
  const c: Record<string, ArenaSeasonStats> = {}

  for (const season of seasons) {
    const key = `${season.season} ${season.year} ${season.league} League`
    if (season.league === "Rec") rec[key] = season
    else c[key] = season
  }

  await writeFile(path.join(import.meta.dir, "hockey_stats_rec.json"), JSON.stringify(rec, null, 2) + "\n")
  await writeFile(path.join(import.meta.dir, "hockey_stats_c.json"), JSON.stringify(c, null, 2) + "\n")
}

async function loadManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"))
  } catch {
    return { seasons: [] }
  }
}

async function writeManifest(manifest: Manifest) {
  await writeText(manifestPath, JSON.stringify(sortManifest(manifest), null, 2) + "\n")
}

function sortManifest(manifest: Manifest): Manifest {
  manifest.seasons.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    const seasonOrder = ["Spring", "Summer", "Fall"]
    if (a.seasonName !== b.seasonName) return seasonOrder.indexOf(a.seasonName) - seasonOrder.indexOf(b.seasonName)
    return a.leagueName.localeCompare(b.leagueName)
  })
  return manifest
}

function upsertManifestEntry(manifest: Manifest, entry: ManifestEntry) {
  const index = manifest.seasons.findIndex((existing) => existing.year === entry.year && existing.seasonName === entry.seasonName && existing.leagueName === entry.leagueName)
  if (index >= 0) manifest.seasons[index] = { ...manifest.seasons[index], ...entry }
  else manifest.seasons.push(entry)
}

function findManifestEntry(manifest: Manifest, season: SeasonRaw): ManifestEntry | undefined {
  return manifest.seasons.find((entry) => entry.year === season.year && entry.seasonName === season.seasonName && entry.leagueName === season.leagueName)
}

function teamLinkMatchesSeason(candidate: { teamName: string; href: string }, season: SeasonRaw): boolean {
  const text = `${candidate.teamName} ${candidate.href}`.toLowerCase()
  if (season.leagueName === "Rec") return text.includes("rec")
  return !text.includes("rec") && /\b(c|cc|c-)\b|suomi-poikas-c/i.test(text)
}

function teamArchivePath(season: SeasonRaw, teamUrl: string): string {
  return path.join("teams", `${season.year}-${season.seasonName.toLowerCase()}-${season.leagueName.toLowerCase()}-${teamIdFromUrl(teamUrl)}.html`)
}

function teamIdFromUrl(url: string): number {
  const match = url.match(/\/teams\/(\d+)\//)
  if (!match) throw new Error(`Could not find team id in URL: ${url}`)
  return numberValue(match[1])
}

function absoluteTeamUrl(href: string): string {
  return normalizeTeamUrl(new URL(href, `${baseUrl}/`).toString())
}

function normalizeTeamUrl(url: string): string {
  const parsed = new URL(url)
  parsed.search = "framed=1"
  return parsed.toString()
}

function scheduleUrl(date: Date): string {
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  return `${baseUrl}/schedule.aspx?facility_id=2042&d=${month}%2f${day}%2f${year}&framed=1`
}

function discoveryDates(season: SeasonRaw): Date[] {
  const [start, end] = discoveryWindow(season)
  const allDates: Date[] = []
  for (let date = start; date <= end; date = addDays(date, 1)) allDates.push(date)

  const preferredDay = season.leagueName === "Rec" ? 6 : 0
  return [...allDates.filter((date) => date.getUTCDay() === preferredDay), ...allDates.filter((date) => date.getUTCDay() !== preferredDay)]
}

function discoveryWindow(season: SeasonRaw): [Date, Date] {
  if (season.seasonName === "Spring") return [utcDate(season.year, 1, 15), utcDate(season.year, 6, 30)]
  if (season.seasonName === "Summer") return [utcDate(season.year, 6, 1), utcDate(season.year, 8, 31)]
  return [utcDate(season.year, 9, 1), utcDate(season.year + 1, 2, 28)]
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

async function fetchOrRead(url: string, filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8")
  } catch {
    return await fetchText(url)
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return await response.text()
}

async function writeText(filePath: string, text: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, text)
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
