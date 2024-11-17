import { getData } from "../../data/poikas"

export const onRequest: PagesFunction = async (context) => {
  const data = getData()

  // grab the name from the ?player= query parameter
  const fullName = new URL(context.request.url).searchParams.get("player")

  // Find the player by name
  const player = data.players.find((p) => p.name === fullName)

  // If we found the player, 301 redirect to /players/:slug
  if (player) {
    return new Response(`Redirecting to /players/${player.slug}`, {
      status: 302,
      headers: {
        location: `/players/${player.slug}`,
      },
    })
  } else {
    // If the player doesn't exist, return a 404
    return new Response(`Player ${fullName} not found`, { status: 404 })
  }
}
