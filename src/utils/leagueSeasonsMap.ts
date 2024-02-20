import type { League, SeasonMap } from "../types"

export function leagueSeasonsMap(leagues: League[]): SeasonMap {
  // Organize data by season
  return leagues.reduce((acc, league) => {
    const key = `${league.year} ${league.season}`
    if (!acc[key]) acc[key] = { rec: "", c: "" }

    let leagueText = league.level === "Rec" ? "Rec League" : "C/CC League"
    if (league.playoffs === "champions") leagueText += ` 🏆`

    leagueText = `<a href="${league.url}">${leagueText}</a>`

    if (league.aside) leagueText += `<span class='extra'> (${league.aside})</span>`

    if (league.level === "Rec") {
      acc[key].rec = leagueText
    } else if (["C", "CC"].includes(league.level)) {
      acc[key].c = leagueText
    }

    return acc
  }, {})
}
