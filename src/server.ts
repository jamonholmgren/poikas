import { serve } from "bun"
import { routeHome } from "./routes"
import { join } from "path"

const server = serve({
  port: 5151,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/") return routeHome(req)
    if (url.pathname === "/styles.css") return routeStatic("styles.css", "text/css")

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running at http://localhost:${server.port}`)

function routeStatic(path: string, contentType: string, otherHeaders = {}) {
  const file = Bun.file(join(import.meta.path, "static", path))
  return new Response(file, { headers: { "content-type": contentType, ...otherHeaders } })
}
