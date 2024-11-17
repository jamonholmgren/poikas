import { serve } from "bun"
import { join, dirname, extname } from "path"
import { HomePage } from "./pages/HomePage"
import { getData } from "./data/load"
import { images } from "./data/images"
import { OpponentPage } from "./pages/OpponentPage"
import { PlayerPage } from "./pages/PlayerPage"
import { AllPlayersPage } from "./pages/AllPlayersPage"
import { JoinPage } from "./pages/JoinPage"
import { PhotosPage } from "./pages/PhotosPage"
import { LeaguePage } from "./pages/LeaguePage"
import { setImageHost } from "./image"

// Grab all the data on server start
const data = getData()

const server = serve({
  port: 5151,
  async fetch(req) {
    const url = new URL(req.url)
    const domain = url.hostname

    // set the image host
    const imageHost = domain === "localhost" ? "/images/" : `https://images.${domain}/`
    setImageHost(imageHost)

    const segments = url.pathname.split("/")
    const segs = segments.length

    if (url.pathname === "/styles.css") {
      return routeStatic("styles.css", "text/css")
    }
    if (url.pathname === "/") {
      return HomePage(data)
    }
    if (url.pathname.startsWith("/vs/")) {
      return OpponentPage(data, segments[2])
    }
    if (url.pathname.startsWith("/players/") && segments[2]) {
      return PlayerPage(data, segments[2])
    }
    if (url.pathname.startsWith("/players")) {
      return AllPlayersPage(data)
    }
    if (url.pathname.startsWith("/join")) {
      return JoinPage(data)
    }
    if (url.pathname.startsWith("/seasons/") && segs > 4) {
      return LeaguePage(data, segments.slice(2).join("/"))
    }
    if (url.pathname.startsWith("/photos")) {
      return PhotosPage(images)
    }
    if (url.pathname.startsWith("/favicon.ico")) {
      return routeStatic("favicon.ico", "image/x-icon")
    }
    if (url.pathname.startsWith("/robots.txt")) {
      return routeStatic("robots.txt", "text/plain")
    }
    if (url.pathname.startsWith("/sitemap.xml")) {
      return routeStatic("sitemap.xml", "application/xml")
    }

    // these should be hosted by nginx, but just in case one slips through, we serve it
    if (url.pathname.startsWith("/images/") && segs > 1) {
      return routeStatic(url.pathname, ct(url.pathname))
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running at http://localhost:${server.port}`)

function routeStatic(path: string, contentType: string, otherHeaders = {}) {
  const projectRoot = dirname(import.meta.dir)
  const file = Bun.file(join(projectRoot, "src", "static", path))
  if (!file.exists()) return new Response("Not Found", { status: 404 })

  return new Response(file, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=700000",
      "content-disposition": "inline",
      ...otherHeaders,
    },
  })
}

// Get the content type from the file name/extension
function ct(fn: string) {
  const ext = extname(fn).slice(1).toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  return `image/${ext}`
}
