import { getData } from "../../data/load"
import { AllPlayersPage } from "../../pages/AllPlayersPage"

export async function onRequest(context) {
  const { players } = getData()

  const html = AllPlayersPage({ players })

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  })
}
