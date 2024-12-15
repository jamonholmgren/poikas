import type { Player } from "../types"

export function sisuCups(player: Player) {
  return [...player.seasons]
    .map((s) => {
      if (!s.games) return []

      const gamesWithSisu = s.games.filter((g) => g.sisu === player.name)

      return gamesWithSisu.map((g) => {
        return {
          season: `<a href="${s.url}">${s.year} ${s.seasonName}</a>`,
          game: g.vsLink,
          date: g.date?.toLocaleDateString() || "-",
          score: `${g.us}-${g.them} (${g.result})`,
          notable: g.notable || "-",
        }
      })
    })
    .flat()
}
