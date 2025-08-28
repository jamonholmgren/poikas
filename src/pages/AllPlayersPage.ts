import type { PoikasData } from "../types"
import { routePage } from "../route"
import { img } from "../image"
import { renderRosterTable } from "../utils/renderRosterTable"

export function AllPlayersPage(data: PoikasData) {
  return routePage({
    path: "/players/",
    title: "All Poikas Players",
    description: "All Poikas Players All Time",
    metaImage: img("finland-flag-icon.png"),
    sidebar: "",
    main: `
      <!-- Hero Section -->
      <div class="players-hero">
        <div class="players-hero-content">
          <div class="players-hero-image">
            <img src="${img("poikas-rec-2023-fall-champions.jpg")}" alt="Poikas Champions" />
          </div>
          <div class="players-hero-info">
            <h1>All Players</h1>
            <p>Complete roster of Suomi Poikas players with career statistics and achievements.</p>
            <div class="players-stats">
              <div class="stat-item">
                <span class="stat-number">${data.players.length}</span>
                <span class="stat-label">Total Players</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${data.players.filter((p) => p.activeSeasons?.Rec || p.activeSeasons?.C).length}</span>
                <span class="stat-label">Active Players</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Players Table Section -->
      <div class="players-table-section">
        ${renderRosterTable({
          id: "players",
          className: "roster",
          columns: [
            { th: "Img", val: "imageHTML", width: 50, alt: "Player image" },
            { th: "Name", val: "profileLink", alt: "Player name" },
            { th: "Pos", val: "pos", alt: "Player position" },
            { th: "Num", val: "number", alt: "Player jersey number" },
            { th: "Ht", val: "ht", alt: "Height", xtra: true },
            { th: "Wt", val: "wt", alt: "Weight", xtra: true },
            { th: "Age", val: "age", alt: "Age (approximately)", xtra: true },
            { th: "G", val: "careerStats.goals", alt: "Career goals", xtra: true },
            { th: "A", val: "careerStats.assists", alt: "Career assists", xtra: true },
            { th: "P", val: "careerStats.points", alt: "Career points (goals + assists)", xtra: true },
            { th: "Rec", val: "seasons.Rec.length", alt: "Total rec seasons played", xtra: true },
            { th: "CC", val: "seasons.CC.length", alt: "Total CC seasons played", xtra: true },
          ],
          players: data.players.sort((a, b) => (a.name > b.name ? 1 : -1)),
        })}
      </div>
    `,
  })
}
