import { JoinPage } from "../src/pages/JoinPage"

export async function onRequest(context) {
  const html = JoinPage()

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
