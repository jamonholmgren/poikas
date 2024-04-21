import { images } from "../../src/data/images"
import { PhotosPage } from "../../src/pages/PhotosPage"

export async function onRequest(context) {
  const html = PhotosPage({ images })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
