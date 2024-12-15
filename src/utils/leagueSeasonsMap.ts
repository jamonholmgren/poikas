import type { Season, SeasonMap } from "../types"

export function leagueSeasonsMap(leagues: Season[]): SeasonMap {
  // Organize data by season
  return leagues.reduce((acc, league) => {
    const key = `${league.year} ${league.seasonName}`
    if (!acc[key]) acc[key] = { rec: "", c: "" }

    let leagueText = league.leagueName === "Rec" ? "Rec League" : "C/CC League"
    if (league.playoffs === "champions") leagueText += ` 🏆`

    leagueText = `<a href="${league.url}">${leagueText}</a>`

    if (league.aside) leagueText += `<span class='extra'> (${league.aside})</span>`

    if (league.leagueName === "Rec") {
      acc[key].rec = leagueText
    } else if (["C", "CC"].includes(league.leagueName)) {
      acc[key].c = leagueText
    }

    return acc
  }, {} as SeasonMap)
}
