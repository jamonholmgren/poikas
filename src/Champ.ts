import type { Player } from "./types"

export function Champ(player: Player) {
  let champ = "-"
  if (player.championships > 0) {
    champ = `<span class="champion">${player.championships}`
    for (let i = 0; i < player.championships; i++) {
      champ += " 🏆"
    }
    champ += "</span>"
  }

  return champ
}
