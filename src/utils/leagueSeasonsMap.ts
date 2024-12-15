import type { PlayerSeason, SeasonMap, LeagueName } from "../types"

export function leagueSeasonsMap(leagues: { [leagueName in LeagueName]: PlayerSeason[] }): SeasonMap {
  // We're constructing a map of:
  // {
  //   "2024 Fall": { rec: "Rec League 🏆", c: "C/CC League" },
  //   "2024 Spring": { rec: "Rec League", c: "C/CC League" },
  //   "2024 Summer": { rec: "Rec League", c: "C/CC League" },
  // }

  const data = Object.entries(leagues).reduce((acc, [leagueName, playerSeasons]) => {
    const season = playerSeasons?.[0]?.season
    if (!season) return acc

    const key = `${season.year} ${season.seasonName}`
    if (!acc[key]) acc[key] = { rec: "", c: "" }

    let leagueText = leagueName === "Rec" ? "Rec League" : "C/CC League"
    if (season.playoffs === "champions") leagueText += ` 🏆`

    leagueText = `<a href="${season.url}">${leagueText}</a>`

    if (season.aside) leagueText += `<span class='extra'> (${season.aside})</span>`

    if (leagueName === "Rec") {
      acc[key].rec = leagueText
    } else if (["C", "CC"].includes(leagueName)) {
      acc[key].c = leagueText
    }

    return acc
  }, {} as SeasonMap)

  return data
}
