/**
 * @typedef {import('./types').RosterData} RosterData
 * @typedef {import('./types').LoadDataOptions} LoadDataOptions
 */

// poor man's jQuery
const $ = document.querySelector.bind(document);
const create = document.createElement.bind(document);

/**
 * @type {RosterData | null}
 */
let _poikasData = null;

/**
 * Fetches, processes, and returns roster data including players and leagues.
 * @param {LoadDataOptions} [options={}] Options for loading data.
 * @returns {Promise<RosterData>} The processed roster data.
 */
async function loadData(options = {}) {
  if (!_poikasData) {
    const response = await fetch("/poikas.json");
    if (!response.ok) {
      throw new Error("Failed to load roster data: " + response.statusText);
    }

    _poikasData = await response.json();

    if (!_poikasData) throw new Error("Failed to parse Poikas roster data.");

    // Sort players by name
    _poikasData.players.sort((a, b) => (a.name < b.name ? -1 : 1));

    // Sort leagues by year, season, and level
    const seasonsOrder = ["Spring", "Summer", "Fall"];
    const levelsOrder = ["Rec", "C"];
    _poikasData.leagues.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.season !== b.season)
        return seasonsOrder.indexOf(a.season) - seasonsOrder.indexOf(b.season);
      return seasonsOrder.indexOf(a.level) - levelsOrder.indexOf(b.level);
    });

    _poikasData.leagues.forEach((league) => {
      // the "pending" playoffs status mean it's a current season
      league.current = league.playoffs === "pending";
    });

    _poikasData.players.forEach((player) => {
      // attach seasons to each player for convenience
      player.seasons = _poikasData.leagues.filter((league) =>
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
      player.championships = _poikasData.leagues
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
  }
  return _poikasData;
}

/**
 * Creates the main nav menu at the top of the page.
 *
 * @param {String} element
 */
function buildMenu(element) {
  const menuItems = [
    { label: "Home", url: "/" },
    { label: "Rec League", url: "/season/?year=2024&season=spring&level=rec" },
    { label: "C/CC", url: "/season/?year=2024&season=spring&level=c" },
    { label: "All Players", url: "/players/" },
    { label: "Join", url: "/join/" },
  ];

  const nav = $(element);
  if (!nav) {
    throw new Error("Could not find nav element: " + element);
  }

  const ul = create("ul");
  nav.appendChild(ul);

  menuItems.forEach((item) => {
    const li = create("li");
    const a = create("a");
    a.href = item.url;
    a.textContent = item.label;
    li.appendChild(a);
    ul.appendChild(li);

    const currentPath =
      window.location.pathname + window.location.search + window.location.hash;

    if (currentPath === item.url) {
      li.classList.add("active");
    } else {
      console.log(currentPath, item.url);
    }
  });
}

/**
 * Renders a table of data based on the data-field of the th elements in the thead.
 *
 * @param {String} tableQuery
 * @param {Array} data
 */
function renderTable(tableQuery, data) {
  const table = $(tableQuery);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  const ths = thead.querySelectorAll("th");
  const fields = Array.from(ths).map((th) => th.dataset.field);

  data.forEach((row) => {
    const tr = create("tr");
    fields.forEach((field) => {
      const td = create("td");
      td.innerHTML = row[field] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderVerticalTable(tableQuery, data) {
  const table = $(tableQuery);

  for (let i = 0; i < table.rows.length; i++) {
    const label = table.rows[i].cells[0].innerText;

    table.rows[i].cells[1].innerHTML = data[label] || "-";
  }
}
