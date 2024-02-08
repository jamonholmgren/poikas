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
