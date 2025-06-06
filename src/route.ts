import { getData } from "./data/load"
import { img } from "./image"

type LayoutOptions = {
  path: string
  title: string
  description: string
  sidebar: string
  main: string
  footer?: string
  metaImage?: string
}

function layout(options: LayoutOptions) {
  const { path, title, description, sidebar, main, footer, metaImage } = options

  const data = getData()

  let currentRecSeason = data.seasons.find((l) => l.current && l.leagueName === "Rec")
  let currentCSeason = data.seasons.find((l) => l.current && l.leagueName === "C")

  if (!currentRecSeason) {
    // grab last rec season
    currentRecSeason = data.seasons.filter((l) => l.leagueName === "Rec").pop()
    if (!currentRecSeason) throw new Error("No rec season found")
  }

  if (!currentCSeason) {
    // grab last c season
    currentCSeason = data.seasons.filter((l) => l.leagueName === "C").pop()
    if (!currentCSeason) throw new Error("No c season found")
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Suomi Poikas Hockey Club</title>
    <meta name="description" content="${description}" />
    <link rel="stylesheet" href="/styles.css?c=3" />
    <link rel="icon" type="image/png" href="${img("finland-flag-icon.png")}" />
    <script src="/sort.js"></script>

    <!-- OG stuff -->
    <meta property="og:title" content="${title} - Suomi Poikas Hockey Club" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${metaImage || img("finland-flag-icon.png")}" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:url" content="https://suomipoikas.com${path}" />
  </head>
  <body>
    <div class="header">
      <h1><a href="/">Suomi Poikas Hockey Club</a></h1>
    </div>
    <nav id="nav">
      <ul>
        <li><a href="/" class="${active("/", path)}">Home</a></li>
        <li><a href="${currentRecSeason!.url}" class="${active(currentRecSeason!.url, path)}">Rec</a></li>
        <li><a href="${currentCSeason!.url}" class="${active(currentCSeason!.url, path)}">C/CC</a></li>
        <li><a href="/players/" class="${active("/players/", path)}">All Players</a></li>
        <li><a href="/photos/" class="${active("/photos/", path)}">Photos</a></li>
        <li><a href="/join/" class="${active("/join/", path)}">Join</a></li>
      </ul>
    </nav>
    <div class="container">
      <div class="sidebar">
        ${sidebar}
      </div>
      <main>
        ${main}
      </main>
    </div>
    <footer>
      ${footer || ""}
      <p>
        Website by
        <a href="https://jamon.dev" target="_blank">Jamon Holmgren</a>.
      </p>
    </footer>
    <!-- Google tag (gtag.js) -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-T6M8LZYF5Q"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-T6M8LZYF5Q");
    </script>
  </body>
</html>
  `
}

export function routePage(options: LayoutOptions) {
  const contents = layout(options)
  return new Response(contents, { headers: { "content-type": "text/html; charset=UTF-8" } })
}

function active(path: string, itemPath: string) {
  return path === itemPath ? "active" : ""
}
