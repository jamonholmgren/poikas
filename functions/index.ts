import { getData } from "../src/data/poikas"
import { HomePage } from "../src/pages/HomePage"

export async function onRequest(context) {
  const data = getData()

  const html = HomePage({ data })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
