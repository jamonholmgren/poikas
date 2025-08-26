import type { Season } from "../types"
import { img } from "../image"

type ChampTileProps = {
  league: Season
}

export function ChampTile({ league }: ChampTileProps): string {
  const { year, seasonName: season, leagueName: level, url, photos } = league

  if (!photos || photos.length === 0) {
    return `
      <!-- No photos for ${year} ${season} ${level} Champions -->
    `
  }

  const lev = level === "CC" ? "CC" : "Rec"

  return `
    <a class="photo" href="${url}">
      <img src="${img(photos[0])}" alt="Suomi Poikas ${year} ${season} ${lev} Champions" />
      <span class="caption">🏆 Suomi Poikas<br />${year} ${season} ${level} Champions</span>
    </a>
  `
}
