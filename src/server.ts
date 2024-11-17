import { serve } from "bun"
import { join, dirname } from "path"
import { HomePage } from "./pages/HomePage"
import { getData } from "./data/load"
import { OpponentPage } from "./pages/OpponentPage"
import { PlayerPage } from "./pages/PlayerPage"

// Grab all the data on server start
const data = getData()

const server = serve({
  port: 5151,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/styles.css") return routeStatic("styles.css", "text/css")
    if (url.pathname === "/") return HomePage(data)
    if (url.pathname.startsWith("/vs/")) return OpponentPage(data, url.pathname.slice(4))
    if (url.pathname.startsWith("/players/")) return PlayerPage(data, url.pathname.slice(8))

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running at http://localhost:${server.port}`)

function routeStatic(path: string, contentType: string, otherHeaders = {}) {
  const projectRoot = dirname(import.meta.dir)
  const file = Bun.file(join(projectRoot, "src", "static", path))
  return new Response(file, { headers: { "content-type": contentType, ...otherHeaders } })
}
