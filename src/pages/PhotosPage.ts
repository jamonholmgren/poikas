import type { PoikasImage } from "../data/images"
import { routePage } from "../route"
import { img } from "../image"

export function PhotosPage(images: PoikasImage[]) {
  return routePage({
    path: "/photos/",
    title: "Suomi Poikas Photos",
    description: "Photos of the Suomi Poikas Hockey Club",
    metaImage: img("000-placeholder.jpg"),
    sidebar: `
      <img src="${img("poikas-2019-rec-faceoff-brenden.jpg")}" alt="Suomi Poikas" />
      <span class="caption">Suomi Poikas</span>
      <p><em>Photo credit <a href="/players/jared-paben">Jared Paben</a></em></p>
    `,
    main: `
      <article>
        <h2>Photos</h2>
        <div id="photos" class="photos">
          ${images
            .map(
              (im) => `
              <div class="photo-item">
                <a href="${img(im.path)}" target="_blank">
                  <img src="${img(im.path)}" alt="${im.caption}" title="${im.caption}"
                      onerror="this.onerror=null;this.src='${img("000-placeholder.jpg")}';" />
                  <abbr class="caption">${im.caption}</abbr>
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
