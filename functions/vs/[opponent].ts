import { getData, slugify } from "../../src/data/poikas"
import { OpponentPage } from "../../src/pages/OpponentPage"

export async function onRequest(context) {
  const data = getData()

  // grab the slugified opponent name from the context
  const slug = context.params.opponent

  // Find all the games against that opponent across rec and C seasons
  const recGames = []
  const cGames = []
  data.leagues.forEach((league) => {
    if (!league.games) return

    league.games?.forEach((game) => {
      if (slugify(game.vs) === slug) {
        if (league.level === "Rec") recGames.push(game)
        if (league.level === "C") cGames.push(game)
      }
    })
  })

  const sampleGame = recGames[0] || cGames[0]
  if (!sampleGame) return new Response(`No games against opponent ${slug} found`, { status: 404 })

  const name = sampleGame ? sampleGame.vs : slug

  const html = OpponentPage({ slug, name, recGames, cGames })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
