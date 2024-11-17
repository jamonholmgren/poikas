import { getData } from "../data/poikas"
import { HomePage } from "../pages/HomePage"

export async function routeHome(req: Request) {
  const data = getData()
  const html = HomePage({ data })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
