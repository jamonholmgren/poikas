import { data } from "../../src/poikas"
import { template } from "../../src/template"
import { PlayerPage } from "../../src/PlayerPage"

export async function onRequest(context) {
  // grab the slugified name from the context
  const slug = context.params.name

  // Find the player by name
  const player = data.players.find((p) => p.slug === slug)

  // If the player doesn't exist, return a 404
  if (!player) {
    return new Response(`Player ${slug} not found`, { status: 404 })
  }

  // find next alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1))
  const nextPlayer = data.players.find((p) => p.name > player.name)

  // find previous alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1))
  const prevPlayer = data.players.find((p) => p.name < player.name)

  const html = PlayerPage({ player, nextPlayer, prevPlayer })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
