import type { Player } from "../types"

export function sisuCups(player: Player) {
  return [...player.leagues]
    .map((s) => {
      if (!s.games) return []

      const gamesWithSisu = s.games.filter((g) => g.sisu === player.name)

      return gamesWithSisu.map((g) => {
        return {
          season: `<a href="${s.url}">${s.year} ${s.season}</a>`,
          game: g.vsLink,
          sisu: `🇫🇮 ${g.sisu}`,
          notable: g.notable || "-",
        }
      })
    })
    .flat()
}
