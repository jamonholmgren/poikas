import type { League } from "../types"
import { img } from "../image"

type ChampTileProps = {
  league: League
}

export function ChampTile({ league }: ChampTileProps): string {
  const { year, season, level, url, photos } = league

  if (!photos || photos.length === 0) {
    return `
      <!-- No photos for ${year} ${season} ${level} Champions -->
    `
  }

  return `
    <a class="photo" href="${url}">
      <img src="${img(photos[0])}" alt="Suomi Poikas ${year} ${season} ${level} Champions" />
      <span class="caption">Suomi Poikas<br />${year} ${season} ${level} Champions</span>
    </a>
  `
}
