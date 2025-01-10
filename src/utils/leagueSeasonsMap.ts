import type { PlayerSeason, SeasonMap, LeagueName, Season, League } from "../types"

export function leagueSeasonsMap(seasons: Season[]): SeasonMap {
  // We're constructing a map of:
  // {
  //   "2024 Fall": { Rec: "Rec League 🏆", C: "C/CC League" },
  //   "2024 Spring": { Rec: "Rec League", C: "C/CC League" },
  //   "2024 Summer": { Rec: "Rec League", C: "C/CC League" },
  // }

  const data: SeasonMap = {}

  seasons.forEach((season) => {
    const key = `${season.year} ${season.seasonName}`
    if (!data[key]) data[key] = { Rec: "", C: "" }

    let leagueText = season.leagueName === "Rec" ? "Rec League" : "C/CC League"
    if (season.playoffs === "champions") leagueText += ` 🏆`

    leagueText = `<a href="${season.url}">${leagueText}</a>`

    if (season.aside) leagueText += `<span class='extra'> (${season.aside})</span>`

    data[key][season.leagueName] = leagueText
  })

  return data
}
