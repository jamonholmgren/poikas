import type { PoikasData, PoikasImage, PlayerSeason, Player, PlayerStats, LeagueName } from "../types"
import { Champ } from "../components/Champ"
import { sisuCups } from "../utils/sisuCups"
import { leagueSeasonsMap } from "../utils/leagueSeasonsMap"
import { fullPos, fullRecord, fullShoots, notableAbbr } from "../utils/strings"
import { images } from "../data/images"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

type SeasonData = {
  seasonLink: string
  record: string
  stats?: PlayerStats
  isGoalie: boolean
  goalieStatsReliable: boolean
}

export function PlayerPage(data: PoikasData, slug: string) {
  const player = data.players.find((p) => p.slug === slug)
  if (!player) return new Response(`Player ${slug} not found`, { status: 404 })

  // find next and previous alphabetical player
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1))
  const prevPlayer = data.players.find((p) => p.name < player.name)
  data.players.reverse()
  const nextPlayer = data.players.find((p) => p.name > player.name)

  const recSeasons = player.seasons.Rec.length || "-"
  const ccSeasons = player.seasons.CC.length || "-"

  const playerImages = images.filter((img: PoikasImage) => img.players.includes(player.name))
  // Also add images from the player's seasons
  const playerSeasonImages = player.seasons.Rec.concat(player.seasons.CC)
    .map((s) => (s.season.photos && s.season.photos.length ? s.season.photos.slice(0, 1) : []))
    .flat()
    .filter((im) => typeof im === "string")
    .map((im: string) => ({
      path: im,
      caption: im,
    }))
  const allImages = [...playerImages, ...playerSeasonImages]

  const rec = player.activeSeasons?.Rec
  const cc = player.activeSeasons?.CC

  // Helper function to build season data for a specific league
  function buildSeasonData(player: Player, leagueName: LeagueName | "Career"): SeasonData[] {
    if (leagueName === "Career") {
      return buildCareerSeasonData(player)
    }

    return player.seasons[leagueName].map((playerSeason: PlayerSeason) => {
      const { season, stats } = playerSeason
      const record = fullRecord(season.wins, season.losses, season.ties)
      const seasonLink = season.link

      return {
        seasonLink,
        record,
        stats,
        isGoalie: isGoaliePosition(player.pos),
        goalieStatsReliable: !season.ignoreGoalieStats,
      }
    })
  }

  const goalieStatValue = (prop: keyof PlayerStats, reliableOnly = false) => (seasonData: SeasonData) => {
    if (reliableOnly && !seasonData.goalieStatsReliable) return "-"
    const value = seasonData.stats?.[prop]
    if (value === undefined || value === null || value === "") return "-"
    return value
  }

  const careerStats = aggregateSeasonStats(Object.values(player.seasons).flat())
  const careerStatsRows = isGoaliePosition(player.pos) ? goalieCareerStatsRows(player, careerStats) : skaterCareerStatsRows(player)

  return routePage({
    path: player.profileURL,
    title: player.name,
    description: player.bio || "",
    metaImage: player.imageURL,
    sidebar: "",
    main: `
      <!-- Hero Section -->
      <div class="player-hero page-hero">
        <div class="page-hero-content">
          <div class="page-hero-image">
            <img
              src="${player.imageURL}"
              alt="${player.name} - Player Photo"
              id="playerimage"
              onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';"
            />
          </div>
          <div class="page-hero-info">
            <h1 class="page-hero-name">${player.name}</h1>
            <div class="page-hero-details">
              <span class="page-hero-number">#${player.number || "-"}</span>
              <span class="page-hero-position">${fullPos(player.pos)}</span>
            </div>
            <div class="page-hero-description">${player.bio || ""}</div>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="content-section">
        <div class="content-grid">
          <div class="content-card">
            <h3>Player Info</h3>
            <div class="table-container">
              <table class="statsheet">
                <tr>
                  <th>Position</th>
                  <td>${fullPos(player.pos)}</td>
                </tr>
                <tr>
                  <th>Number</th>
                  <td>${player.number || "-"}</td>
                </tr>
                <tr>
                  <th>Age</th>
                  <td>${player.age() || "-"}</td>
                </tr>
                <tr>
                  <th>Height</th>
                  <td>${player.ht || "-"}</td>
                </tr>
                <tr>
                  <th>Weight</th>
                  <td>${player.wt || "-"}</td>
                </tr>
                <tr>
                  <th>Shoots</th>
                  <td>${fullShoots(player.shoots)}</td>
                </tr>
                <tr>
                  <th>Joined</th>
                  <td>${player.startYear || "-"}</td>
                </tr>
                <tr>
                  <th>Years</th>
                  <td>${player.years || "-"}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="content-card">
            <h3>Career Stats</h3>
            <div class="table-container">
              <table class="statsheet">
                ${careerStatsRows}
                <tr>
                  <th>Rec Seasons</th>
                  <td>${recSeasons}</td>
                </tr>
                <tr>
                  <th>CC Seasons</th>
                  <td>${ccSeasons}</td>
                </tr>
                <tr>
                  <th>Championships</th>
                  <td>${Champ(player)}</td>
                </tr>
                ${(rec && activeStats(rec)) || ""}
                ${(cc && activeStats(cc)) || ""}
              </table>
            </div>
          </div>
        </div>
      </div>

      ${
        allImages.length
          ? `
            <div class="media-section">
              <h2>Photos</h2>
              <div id="photos" class="media-grid">
                ${allImages
                  .map(
                    (im) => `
                  <div class="media-item">
                    <a href="${img(im.path)}" target="_blank">
                      <img src="${img(im.path)}" alt="${im.caption}" title="${im.caption}" onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';" />
                      <span class="caption">${im.caption}</span>
                    </a>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
          : ""
      }
      
      <div class="seasons">
        <h2>Season Stats</h2>
        ${Object.keys(player.seasons)
          .concat(["Career"])
          .map((k: string) => {
            if (k !== "Career" && player.seasons[k as LeagueName].length === 0) return ""
            return `
              <h3>${k} League Seasons</h3>
              ${renderRosterTable<SeasonData>({
                id: "${k}-seasons",
                className: "seasons",
                columns: [
                  { th: "Season", val: "seasonLink", width: 200, alt: "Season name and link" },
                  { th: "Team WLT", val: "record", width: 100, alt: "Team win-loss-tie record" },
                  ...(isGoaliePosition(player.pos)
                    ? [
                        { th: "GP", width: 50, alt: "Games played", getValue: goalieStatValue("goalieGamesPlayed") },
                        { th: "WLT", width: 50, alt: "Player win-loss-tie record", getValue: goalieStatValue("goalieRecord") },
                        { th: "GAA", width: 50, alt: "Goals against average", getValue: goalieStatValue("goalsAgainstAverageFormatted", true) },
                        { th: "SV%", width: 50, alt: "Save percentage", getValue: goalieStatValue("savePercentageFormatted", true) },
                        { th: "SA/G", width: 50, alt: "Shots against per game", getValue: goalieStatValue("averageShotsAgainstFormatted", true) },
                        { th: "SO", width: 50, alt: "Shutouts", getValue: goalieStatValue("shutouts", true) },
                      ]
                    : []),
                  { th: "G", width: 50, alt: "Goals", val: "stats.goals" },
                  { th: "A", width: 50, alt: "Assists", val: "stats.assists" },
                  { th: "P", width: 50, alt: "Points", val: "stats.points" },
                  { th: "PIM", width: 50, alt: "Penalty minutes", val: "stats.pim" },
                ],
                players: buildSeasonData(player, k as LeagueName),
              })}`
          })
          .join("\n")}
      </div>
      <div class="sisucup">
        <h2>Sisu Cups Won</h2>
        <p>
          The "Sisu Cup" is awarded to the player who demonstrates the most
          <strong>sisu</strong> <em>(pronounced – see'soo)</em> in a game.
          Sisu is a Finnish word that doesn't have a precise equivalent in
          English, but is similar to "guts" or "grit" or "perseverance".
        </p>
        <div class="table-container">
          <table id="sisucup" class="seasons">
            <thead>
              <tr>
                <th data-field="season">Season</th>
                <th data-field="date">Date</th>
                <th data-field="game">Game</th>
                <th data-field="sisu">Score</th>
                <th data-field="notable" class="extra">Notable</th>
              </tr>
            </thead>
            <tbody>
            ${sisuCups(player)
              .map(
                (cup) => `
            <tr>
              <td>${cup.season}</td>
              <td>${cup.date}</td>
              <td>${cup.game}</td>
              <td>${cup.score}</td>
              <td class="extra">${notableAbbr(cup.notable, 20)}</td>
            </tr>
                `,
              )
              .join("")}

          </tbody>
        </table>
        </div>
        <div class="prevnext">
          ${prevPlayer ? `<a href="${prevPlayer.profileURL}" id="prev">← ${prevPlayer.name}</a>` : ""}
          ${nextPlayer ? `<a href="${nextPlayer.profileURL}" id="next">${nextPlayer.name} →</a>` : ""}
        </div>
      </div>
    `,
    footer: ``,
  })
}

function isGoaliePosition(pos?: string): boolean {
  return !!pos?.split("/").includes("G")
}

function buildCareerSeasonData(player: Player): SeasonData[] {
  const careerRows: SeasonData[] = []

  for (const leagueName of ["Rec", "CC"] as LeagueName[]) {
    const seasons = player.seasons[leagueName]
    if (!seasons.length) continue

    const stats = aggregateSeasonStats(seasons)
    careerRows.push({
      seasonLink: leagueName,
      record: fullRecord(stats.teamWins, stats.teamLosses, stats.teamTies),
      stats,
      isGoalie: isGoaliePosition(player.pos),
      goalieStatsReliable: true,
    })
  }

  const stats = aggregateSeasonStats(Object.values(player.seasons).flat())
  careerRows.push({
    seasonLink: "Career",
    record: fullRecord(stats.teamWins, stats.teamLosses, stats.teamTies),
    stats,
    isGoalie: isGoaliePosition(player.pos),
    goalieStatsReliable: true,
  })

  return careerRows
}

function aggregateSeasonStats(seasons: PlayerSeason[]): PlayerStats {
  const stats = emptyStats()

  seasons.forEach((playerSeason) => {
    const seasonStats = playerSeason.stats
    stats.goals += seasonStats.goals
    stats.assists += seasonStats.assists
    stats.points += seasonStats.points
    stats.penalties += seasonStats.penalties
    stats.pim += seasonStats.pim
    stats.teamWins += playerSeason.season.wins || 0
    stats.teamLosses += playerSeason.season.losses || 0
    stats.teamTies += playerSeason.season.ties || 0

    if (playerSeason.season.ignoreGoalieStats) return

    stats.goalieGamesPlayed += seasonStats.goalieGamesPlayed
    stats.goalieGamesWithShots += seasonStats.goalieGamesWithShots
    stats.goalieWins += seasonStats.goalieWins
    stats.goalieLosses += seasonStats.goalieLosses
    stats.goalieTies += seasonStats.goalieTies
    stats.shotsFor += seasonStats.shotsFor
    stats.shotsAgainst += seasonStats.shotsAgainst
    stats.goalsAgainst += seasonStats.goalsAgainst
    stats.goalsAgainstWithShots += seasonStats.goalsAgainstWithShots
    stats.goalsAgainstEmptyNetters += seasonStats.goalsAgainstEmptyNetters
    stats.shutouts += seasonStats.shutouts
  })

  populateGoalieStatsAggregates(stats)
  stats.record = fullRecord(stats.teamWins, stats.teamLosses, stats.teamTies)
  return stats
}

function skaterCareerStatsRows(player: Player) {
  const stats = aggregateSeasonStats(Object.values(player.seasons).flat())
  const careerGoals = stats.goals
  const careerAssists = stats.assists
  return `
    <tr>
      <th>Career Goals</th>
      <td>${careerGoals || "-"}</td>
    </tr>
    <tr>
      <th>Career Assists</th>
      <td>${careerAssists || "-"}</td>
    </tr>
    <tr>
      <th>Career Points</th>
      <td>${careerGoals + careerAssists || "-"}</td>
    </tr>
    <tr>
      <th>Career PIM</th>
      <td>${stats.pim || "-"}</td>
    </tr>
  `
}

function goalieCareerStatsRows(player: Player, stats: PlayerStats) {
  const careerGoals = stats.goals
  const careerAssists = stats.assists
  const careerPoints = careerGoals + careerAssists

  return `
    <tr>
      <th>Career GP</th>
      <td>${stats.goalieGamesPlayed || "-"}</td>
    </tr>
    <tr>
      <th>Career WLT</th>
      <td>${stats.goalieRecord || "-"}</td>
    </tr>
    <tr>
      <th>Career GAA</th>
      <td>${stats.goalieGamesPlayed ? stats.goalsAgainstAverageFormatted : "-"}</td>
    </tr>
    <tr>
      <th>Career SV%</th>
      <td>${stats.goalieGamesWithShots ? stats.savePercentageFormatted : "-"}</td>
    </tr>
    <tr>
      <th>Career SA/G</th>
      <td>${stats.goalieGamesWithShots ? stats.averageShotsAgainstFormatted : "-"}</td>
    </tr>
    <tr>
      <th>Career SO</th>
      <td>${stats.shutouts || "-"}</td>
    </tr>
    <tr>
      <th>Skater G-A-P</th>
      <td>${careerGoals}-${careerAssists}-${careerPoints}</td>
    </tr>
    <tr>
      <th>Skater PIM</th>
      <td>${stats.pim || "-"}</td>
    </tr>
  `
}

function populateGoalieStatsAggregates(stats: PlayerStats) {
  const gp: number = stats.goalieGamesPlayed
  const gws: number = stats.goalieGamesWithShots
  const sa: number = stats.shotsAgainst
  const ga: number = stats.goalsAgainst - stats.goalsAgainstEmptyNetters
  const gaw: number = stats.goalsAgainstWithShots - stats.goalsAgainstEmptyNetters
  const gw: number = stats.goalieWins
  const gl: number = stats.goalieLosses
  const gt: number = stats.goalieTies
  if (gaw > 0) stats.savePercentage = parseFloat((sa > 0 ? ((sa - gaw) / sa) * 100 : 0).toFixed(1))
  if (gws > 0) stats.averageShotsAgainst = parseFloat((sa / gws).toFixed(1))
  stats.goalsAgainstAverage = gp > 0 ? parseFloat((ga / gp).toFixed(2)) : 0
  stats.goalieRecord = `${gw}-${gl}-${gt}`
  stats.saves = sa - gaw

  stats.goalsAgainstAverageFormatted = gp > 0 ? stats.goalsAgainstAverage.toFixed(2) : "0.00"
  stats.savePercentageFormatted = stats.savePercentage ? stats.savePercentage.toFixed(1) + "%" : "0.0%"
  stats.averageShotsAgainstFormatted = stats.averageShotsAgainst ? stats.averageShotsAgainst.toFixed(1) : "0.0"
}

function emptyStats(): PlayerStats {
  return {
    goals: 0,
    assists: 0,
    points: 0,
    penalties: 0,
    pim: 0,
    goalieGamesPlayed: 0,
    goalieGamesWithShots: 0,
    goalieWins: 0,
    goalieLosses: 0,
    goalieTies: 0,
    goalieRecord: "",
    shotsFor: 0,
    shotsAgainst: 0,
    goalsAgainst: 0,
    goalsAgainstWithShots: 0,
    goalsAgainstEmptyNetters: 0,
    savePercentage: 0,
    goalsAgainstAverage: 0,
    averageShotsAgainst: 0,
    shutouts: 0,
    saves: 0,
    goalsAgainstAverageFormatted: "",
    savePercentageFormatted: "",
    averageShotsAgainstFormatted: "",
    teamWins: 0,
    teamLosses: 0,
    teamTies: 0,
    record: "",
  }
}

function activeStats(season: PlayerSeason) {
  return `
    <tr>
      <th>Current ${season.leagueName} Goals</th>
      <td>${season.stats?.goals || "-"}</td>
    </tr>
    <tr>
      <th>Current ${season.leagueName} Assists</th>
      <td>${season.stats?.assists || "-"}</td>
    </tr>
  `
}
