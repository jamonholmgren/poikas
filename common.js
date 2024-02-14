/**
 * @typedef {import('./types').RosterData} RosterData
 * @typedef {import('./types').LoadDataOptions} LoadDataOptions
 */

/**
 * @type {RosterData | null}
 */
let _rosterData = null;

/**
 * Fetches, processes, and returns roster data including players and leagues.
 * @param {LoadDataOptions} [options={}] Options for loading data.
 * @returns {Promise<RosterData>} The processed roster data.
 */
async function loadData(options = {}) {
  if (!_rosterData) {
    const response = await fetch("/poikas.json");
    if (!response.ok) {
      throw new Error("Failed to load roster data: " + response.statusText);
    }

    _rosterData = await response.json();

    if (!_rosterData) throw new Error("Failed to parse roster data.");

    // Sort players by name
    _rosterData.players.sort((a, b) => (a.name < b.name ? -1 : 1));

    // Sort leagues by year, season, and level
    const seasonsOrder = ["Spring", "Summer", "Fall"];
    const levelsOrder = ["Rec", "C"];
    _rosterData.leagues.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.season !== b.season)
        return seasonsOrder.indexOf(a.season) - seasonsOrder.indexOf(b.season);
      return seasonsOrder.indexOf(a.level) - levelsOrder.indexOf(b.level);
    });

    _rosterData.players.forEach((player) => {
      // attach seasons to each player for convenience
      player.seasons = _rosterData.leagues.filter((league) =>
        league.roster.includes(player.name)
      );

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
      player.championships = _rosterData.leagues
        .filter((league) => league.playoffs === "champions")
        .filter((league) => league.roster.includes(player.name)).length;
    });
  }
  return _rosterData;
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
    { label: "Join", url: "/join/" },
  ];

  const nav = document.querySelector(element);
  if (!nav) {
    throw new Error("Could not find nav element: " + element);
  }

  const ul = document.createElement("ul");
  nav.appendChild(ul);

  menuItems.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
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
