import { getData } from "../../src/data/poikas"
import { LeaguePage } from "../../src/pages/LeaguePage"

export async function onRequest(context) {
  const data = getData()

  // grab the data from the params
  const segments = context.params.season

  // match against the particular league
  const league = data.leagues.find(
    (l) =>
      l.year.toString() === segments[0] &&
      l.season.toLowerCase() === segments[1] &&
      l.level.toLowerCase() === segments[2]
  )

  // if no league found, return a 404
  if (!league) return new Response(`League not found: ${segments.join("/")}`, { status: 404 })

  const html = LeaguePage({ league })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
