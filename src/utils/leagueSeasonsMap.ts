import type { League, SeasonMap } from "../types"

export function leagueSeasonsMap(leagues: League[]): SeasonMap {
  // Organize data by season
  return leagues.reduce((acc, league) => {
    const key = `${league.year} ${league.season}`
    if (!acc[key]) acc[key] = { rec: "", c: "" }

    const leagueUrl = `/season/?year=${
      league.year
    }&season=${league.season.toLowerCase()}&level=${league.level.toLowerCase()}`
    let leagueText = league.level === "Rec" ? "Rec League" : "C/CC League"
    if (league.playoffs === "champions") {
      leagueText += ` 🏆`
    }

    leagueText = `<a href="${leagueUrl}">${leagueText}</a>`

    if (league.aside) {
      leagueText += `<span class='extra'> (${league.aside})</span>`
    }

    if (league.level === "Rec") {
      acc[key].rec = leagueText
    } else if (["C", "CC"].includes(league.level)) {
      acc[key].c = leagueText
    }

    return acc
  }, {})
}
