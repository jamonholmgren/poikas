import { getData } from "./data/poikas"

type TemplateOptions = {
  path: string
  title: string
  description: string
  sidebar: string
  main: string
  footer?: string
  metaImage?: string
}

export function template(options: TemplateOptions) {
  const { path, title, description, sidebar, main, footer, metaImage } = options

  const data = getData()

  let currentRecSeason = data.leagues.find((l) => l.current && l.level === "Rec")
  let currentCSeason = data.leagues.find((l) => l.current && l.level === "C")

  if (!currentRecSeason) {
    // grab last rec season
    currentRecSeason = data.leagues.filter((l) => l.level === "Rec").pop()
    if (!currentRecSeason) throw new Error("No rec season found")
  }

  if (!currentCSeason) {
    // grab last c season
    currentCSeason = data.leagues.filter((l) => l.level === "C").pop()
    if (!currentCSeason) throw new Error("No c season found")
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Suomi Poikas Hockey Club</title>
    <meta name="description" content="${description}" />
    <link rel="stylesheet" href="/styles.css?c=2" />
    <link rel="icon" type="image/png" href="/images/finland-flag-icon.png" />

    <!-- OG stuff -->
    <meta property="og:title" content="${title} - Suomi Poikas Hockey Club" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${metaImage || "/images/finland-flag-icon.png"}" />
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

function active(path: string, itemPath: string) {
  return path === itemPath ? "active" : ""
}
