import { getData } from "../../data/load"

export const onRequest: PagesFunction = async (context) => {
  const data = getData()

  // /season/?year=2024&season=spring&level=rec
  // grab the parameters
  const params = new URL(context.request.url).searchParams
  const year = parseInt(params.get("year"), 10)
  const season = params.get("season").toLowerCase()
  const level = params.get("level").toLowerCase()

  // Find the league
  const league = data.leagues.find(
    (l) => l.year === year && l.season.toLowerCase() === season && l.level.toLowerCase() === level
  )

  // If we found the league, 301 redirect to /seasons/:year/:season/:level
  if (league) {
    const redirectUrl = `/seasons/${year}/${season}/${level}`
    return new Response(`Redirecting to ${redirectUrl}`, {
      status: 302,
      headers: {
        location: redirectUrl,
      },
    })
  } else {
    // If the player doesn't exist, return a 404
    return new Response(`League ${year} ${season} ${level} not found`, { status: 404 })
  }
}
