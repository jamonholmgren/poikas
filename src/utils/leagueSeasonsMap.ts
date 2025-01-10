import type { PlayerSeason, SeasonMap, LeagueName } from "../types"

export function leagueSeasonsMap(leagues: { [leagueName in LeagueName]: PlayerSeason[] }): SeasonMap {
  // We're constructing a map of:
  // {
  //   "2024 Fall": { Rec: "Rec League 🏆", C: "C/CC League" },
  //   "2024 Spring": { Rec: "Rec League", C: "C/CC League" },
  //   "2024 Summer": { Rec: "Rec League", C: "C/CC League" },
  // }

  const data: SeasonMap = {}

  Object.keys(leagues).forEach((ln) => {
    const leagueName = ln as LeagueName // cast to avoid type error

    leagues[leagueName].forEach((playerSeason) => {
      const season = playerSeason.season
      const key = `${season.year} ${season.seasonName}`
      if (!data[key]) data[key] = { Rec: "", C: "" }

      let leagueText = leagueName === "Rec" ? "Rec League" : "C/CC League"
      if (season.playoffs === "champions") leagueText += ` 🏆`

      leagueText = `<a href="${season.url}">${leagueText}</a>`

      if (season.aside) leagueText += `<span class='extra'> (${season.aside})</span>`

      data[key][leagueName] = leagueText
    })
  })

  return data
}
