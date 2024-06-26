import { layout } from "../layout"
import { type PoikasImage } from "../data/images"

type PhotosPageProps = {
  images: PoikasImage[]
}

export function PhotosPage({ images }: PhotosPageProps) {
  return layout({
    path: "/join/",
    title: "Suomi Poikas Photos",
    description: "Photos of the Suomi Poikas Hockey Club",
    metaImage: "/images/000-placeholder.jpg",
    sidebar: `
      <img src="/images/poikas-2019-rec-faceoff-brenden.jpg" alt="Suomi Poikas" />
      <span class="caption">Suomi Poikas</span>
      <p><em>Photo credit <a href="/players/jared-paben">Jared Paben</a></em></p>
    `,
    main: `
      <article>
        <h2>Photos</h2>
        <div id="photos" class="photos">
          ${images
            .map(
              (img) => `
              <div class="photo-item">
                <a href="${img.path}" target="_blank">
                  <img src="${img.path}" alt="${img.caption}" title="${img.caption}"
                      onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';" />
                  <abbr class="caption">${img.caption}</abbr>
                </a>
              </div>
            `
            )
            .join("")}
        </div>
      </article>
    `,
  })
}
