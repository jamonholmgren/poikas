import type { Game, Player } from "../types"

export function sisuCups(player: Player) {
  const sisuGames = Object.values(player.seasons)
    .flat()
    .flatMap((s) => s.season.games || [])
    .filter((g) => g.sisu === player.name)
    .sort(byDateOrSeason)

  return sisuGames.map((g) => {
    const s = g.season
    if (!s) throw new Error("No season found!!")

    return {
      season: `<a href="${s.url}">${s.year} ${s.seasonName}</a>`,
      game: g.vsLink,
      date: g.date?.toLocaleDateString() || "-",
      score: `${g.us}-${g.them} (${g.result})`,
      notable: g.notable || "-",
    }
  })
}

function byDateOrSeason(a: Game, b: Game) {
  if (a.date && b.date) return a.date.getTime() - b.date.getTime()
  if (a.season && b.season) return a.season.year - b.season.year
  return 0
}
