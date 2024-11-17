import { getData } from "../data/poikas"
import { HomePage } from "../pages/HomePage"

export async function onRequest(context: EventContext<any, any, any>) {
  const data = getData()

  const html = HomePage({ data })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
