import type { Game, LeagueName, Player, PoikasData, Season } from "../types"

export function seasonHeading(season: Season) {
  return `${season.seasonName === "Fall" ? "Fall/Winter" : season.seasonName} ${season.year}`
}

const completed = (game: Game) => Boolean(game.result && !["pending", "cancelled"].includes(game.result))

export function opponentRecord(season: Season, next: Game) {
  // Only this league/season, and only games completed before the upcoming matchup.
  const games = (season.games || []).filter(g => completed(g) && g.vs === next.vs && (!g.date || !next.date || g.date < next.date))
  if (!games.length) return `This is our first game against the ${next.vs} this season.`
  const wins = games.filter(g => g.result === "won").length
  const losses = games.filter(g => g.result === "lost" || g.result === "forfeited").length
  // Consistent with the site's league records: overtime losses count in the tie column.
  const ties = games.filter(g => g.result === "tied" || g.result === "lost-ot").length
  return `We are ${wins}-${losses}-${ties} against the ${next.vs} this season.`
}

type PointsRow = { player: Player; goals: number; assists: number; points: number; rank: number }

export function seasonPoints(season: Season): PointsRow[] {
  // Use one complete source per player, never add arena totals to tracked game totals.
  return [...new Map((season.players || []).map(p => [p.name, p])).values()].map(player => {
    let goals = 0, assists = 0
    for (const game of season.games || []) {
      if (!completed(game)) continue
      goals += game.stats?.[player.name]?.goals || 0
      assists += game.stats?.[player.name]?.assists || 0
    }
    const arena = season.arenaReportedStats?.players.find(p => p.name === player.name)
    if (arena && arena.goals + arena.assists >= goals + assists) {
      goals = arena.goals
      assists = arena.assists
    }
    return { player, goals, assists, points: goals + assists, rank: 0 }
  }).filter(p => p.points > 0)
    .sort((a, b) => b.points - a.points || b.goals - a.goals || a.player.name.localeCompare(b.player.name))
    .map((p, i, all) => ({ ...p, rank: all.findIndex(other => other.points === p.points) + 1 }))
}

export function pointsLeaderboard(data: PoikasData, current: Season) {
  const order = { Spring: 0, Summer: 1, Fall: 2 }
  const seasons = data.seasons.filter(s => s.leagueName === current.leagueName)
    .toSorted((a, b) => a.year - b.year || order[a.seasonName] - order[b.seasonName])
  let season = current
  let rows = seasonPoints(season)
  const previous = seasons[seasons.indexOf(current) - 1]
  if (!rows.length && previous) {
    season = previous
    rows = seasonPoints(season)
  }
  return { season, fallback: season !== current, rows: rows.slice(0, 5) }
}

export function renderPointsLeaderboard(board: ReturnType<typeof pointsLeaderboard>, league: LeagueName) {
  return `<section class="points-card" aria-labelledby="${league.toLowerCase()}-points-title">
    <h2 id="${league.toLowerCase()}-points-title">${league} Points Leaders</h2>
    <p class="leaderboard-season"><a href="${board.season.url}">${board.season.seasonName} ${board.season.year} ${league}</a>${board.fallback ? ' · Previous season (current season stats not yet available)' : ''}</p>
    ${board.rows.length ? `<table class="points-table">
      <caption>Top five players · recorded points (ties: goals, then name)</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col"><abbr title="Goals">G</abbr></th><th scope="col"><abbr title="Assists">A</abbr></th><th scope="col"><abbr title="Points">PTS</abbr></th></tr></thead>
      <tbody>${board.rows.map(p => `<tr><td>${p.rank}</td><th scope="row"><a href="${p.player.profileURL}">${p.player.name}</a></th><td>${p.goals}</td><td>${p.assists}</td><td><strong>${p.points}</strong></td></tr>`).join('')}</tbody>
    </table>` : '<p>Scoring statistics are not available yet.</p>'}
  </section>`
}
