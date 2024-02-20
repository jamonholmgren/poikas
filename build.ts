// Runs in a Bun build environment only.
// Actually never mind.......
process.exit(1);

// Set up config
const TEMPLATE_PATH = "./template";

// Load the template layout as a string
const layout = await Bun.file(`${TEMPLATE_PATH}/layout.html`).text();

console.log("layout", layout);

/**
 * Layout looks like this:
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{$TITLE}}</title>
    <link rel="stylesheet" href="/styles.css?c=2" />
    <link rel="icon" type="image/png" href="/images/finland-flag-icon.png" />

    {{$SCRIPTS}}
  </head>
  <body>
    {{$BODY}}

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
 */

// Load the data from ./poikas.json
const data = require("./poikas.json");

/**
 * Data looks like this:
 * 
 {
   "leagues": [
     {
      "year": 2023,
      "season": "Spring",
      "level": "C",
      "wins": 5,
      "losses": 10,
      "ties": 0,
      "playoffs": "lost",
      "roster": [
        "Asa Storm",
        "Evan Tapio",
        "Eric Matson",
        "Jared Paben",
        "Joel Mattila",
        "Matt Bromley",
        "Nels Tapio",
        "Oren Matson",
        "Randy Storm",
        "Rick Ramstetter",
        "Scott Daniels",
        "Steve Saunders",
        "Jamon Holmgren"
      ],
      "games": [
        {
          "vs": "Bandits",
          "us": 2,
          "them": 4,
          "result": "lost",
          "sisu": "Evan Tapio",
          "notable": "They scored an empty netter."
        },
        {
          "vs": "Lightning",
          "us": 4,
          "them": 3,
          "result": "won",
          "sisu": "Steve Saunders"
        },
        {
          "vs": "PBR",
          "us": 6,
          "them": 2,
          "result": "won",
          "sisu": "Eric Matson",
          "notable": "Steve Saunders had a hat trick."
        },
        {
          "vs": "Dead Guys",
          "us": 2,
          "them": 4,
          "result": "lost",
          "sisu": "Jamon Holmgren"
        },
        {
          "vs": "2 Towns",
          "us": 4,
          "them": 6,
          "result": "lost",
          "sisu": "Scott Daniels"
        },
        {
          "vs": "CCCP",
          "us": 4,
          "them": 5,
          "result": "lost",
          "sisu": "Nels Tapio",
          "notable": "Lost in a shootout."
        },
        {
          "vs": "Revolution",
          "us": 2,
          "them": 4,
          "result": "lost",
          "sisu": "Eric Matson"
        },
        {
          "vs": "Badgers",
          "us": 5,
          "them": 3,
          "result": "won",
          "sisu": "Steve Saunders"
        },
        {
          "vs": "Callahan",
          "us": 2,
          "them": 4,
          "result": "lost",
          "sisu": "Jared Paben"
        },
        {
          "vs": "Bandits",
          "us": 5,
          "them": 2,
          "result": "won",
          "sisu": "Brad Wuori"
        },
        {
          "vs": "Lightning",
          "us": 6,
          "them": 11,
          "result": "lost",
          "sisu": "Steve Saunders"
        },
        {
          "vs": "PBR",
          "us": 8,
          "them": 7,
          "result": "won",
          "sisu": "Oren Matson",
          "notable": "Joel game winner."
        },
        {
          "vs": "Dead Guys",
          "us": 2,
          "them": 5,
          "result": "lost",
          "sisu": "Matt Bromley"
        },
        {
          "vs": "2 Towns",
          "us": 0,
          "them": 12,
          "result": "lost"
        },
        {
          "vs": "CCCP",
          "us": 5,
          "them": 11,
          "result": "lost"
        },
        {
          "vs": "Lightning",
          "us": 3,
          "them": 5,
          "result": "lost",
          "sisu": "Erik Benton",
          "notable": "Playoffs round 1."
        }
      ]
    },
    { ... more leagues ... }
  ],
  "players": [
    {
      "number": 29,
      "name": "Asa Storm",
      "bio": "Asa is Randy's son and Nolan's brother, and has been a top level scorer in both Rec and C leagues. He brings speed and power to the wing positions.",
      "pos": "W",
      "shoots": "R",
      "ht": "5-10",
      "wt": 190,
      "born": 1998
    },
    { ... more players ... }
  ]
 * 
 */

// data type for all the data
type PoikasData = {
  leagues: League[];
  players: Player[];
};

type Game = {
  vs: string;
  us: number;
  them: number;
  result: string;
  sisu?: string;
  notable?: string;
};

type League = {
  year: number;
  season: string;
  level: string;
  wins: number;
  losses: number;
  ties: number;
  playoffs: string;
  roster: string[];
  games: Game[];

  // processed data that we add
  current?: boolean;
  players?: Player[];
};

type Player = {
  // original data from the JSON
  number?: number;
  name: string;
  bio?: string;
  pos?: string;
  shoots?: string;
  ht?: string;
  wt?: number;
  born?: number;

  // processed data that we add later
  seasons: League[];
  active: boolean;
  recLink: string;
  cLink: string;
  years: number;
  startYear: number;
  endYear: number;
  age: number | undefined;
  championships: number;
  imageURL: string;
  imageHTML: string;
  profileURL: string;
  profileLink: string;
};

// Build all the player pages, at /players/asa-storm/index.html, etc.

// Common functions

export function processPoikasData(data: PoikasData) {
  // Sort players by name
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1));

  // Sort leagues by year, season, and level
  const seasonsOrder = ["Spring", "Summer", "Fall"];
  const levelsOrder = ["Rec", "C"];
  data.leagues.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.season !== b.season)
      return seasonsOrder.indexOf(a.season) - seasonsOrder.indexOf(b.season);
    return seasonsOrder.indexOf(a.level) - levelsOrder.indexOf(b.level);
  });

  data.leagues.forEach((league) => {
    // the "pending" playoffs status mean it's a current season
    league.current = league.playoffs === "pending";

    // for leagues with games listed, calculate w/l/t
    if (league.games) {
      league.wins = league.games.filter((g) => g.result === "won").length;
      league.losses = league.games.filter((g) => g.result === "lost").length;
      league.ties = league.games.filter(
        (g) => g.result === "tied" || g.result === "lost-ot"
      ).length;
    }
  });

  data.players.forEach((player) => {
    // attach seasons to each player for convenience
    player.seasons = data.leagues.filter((league) =>
      league.roster.includes(player.name)
    );

    // and the reverse too -- add players to each season
    player.seasons.forEach((season) => {
      season.players ||= [];
      season.players.push(player);
    });

    // is this player currently active?
    player.active = player.seasons.some((season) => season.current);

    // rec and c/cc links
    const rec = player.seasons.find((s) => s.current && s.level === "Rec");
    const c = player.seasons.find((s) => s.current && s.level === "C");
    player.recLink = rec
      ? `<a href="/season/?year=${rec.year}&season=${rec.season}&level=${rec.level}">Rec</a>`
      : "-";
    player.cLink = c
      ? `<a href="/season/?year=${c.year}&season=${c.season}&level=${c.level}">C/CC</a>`
      : "-";

    // how many active calendar years has this player played?
    const activeYears = [
      ...new Set(player.seasons.map((season) => season.year)),
    ];

    player.years = activeYears.length;
    player.startYear = activeYears[0];
    player.endYear = activeYears[activeYears.length - 1];

    player.age = player.born
      ? new Date().getFullYear() - player.born - 1
      : undefined;

    // how many championships?
    player.championships = data.leagues
      .filter((league) => league.playoffs === "champions")
      .filter((league) => league.roster.includes(player.name)).length;

    // player image URL and HTML
    player.imageURL = `/images/${player.number}-${player.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.jpg`;
    player.imageHTML = `<img src="${player.imageURL}" alt="${player.name}" onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';">`;

    // player profile URL
    player.profileURL = `/player/?player=${player.name}`;
    player.profileLink = `<a href="${player.profileURL}">${player.name}</a>`;
  });

  return data;
}
