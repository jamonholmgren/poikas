let _rosterData;
async function loadRoster() {
  if (!_rosterData) {
    const response = await fetch("./poikas.json");
    if (!response.ok) {
      throw new Error("Failed to load roster data: " + response.statusText);
    }

    _rosterData = await response.json();
  }
  return _rosterData;
}

/**
 * Loads the team roster JSON and updates the table based on the specified season.
 */
async function loadAndDisplayRoster() {
  const data = await loadRoster();

  const { leagues, players } = data;
  const { year, season, level } = window.poikas;

  players.sort((a, b) => (a.name < b.name ? -1 : 1)); // Sort players by name

  populateSwitchers(data); // Populate switchers with unique years, seasons, and levels

  // Find the current team based on year, season, and level
  const currentTeam = leagues.find(
    (league) =>
      league.year === year && league.season === season && league.level === level
  );
  if (!currentTeam) {
    console.error("Current team not found.");
    return;
  }

  // Filter players who are in the current team's roster
  const rosterPlayers = players.filter((player) =>
    currentTeam.roster.includes(player.name)
  );

  // Generate and insert table rows for each player
  updateRosterTable(rosterPlayers);
}

/**
 * Generates HTML table rows for each player and inserts them into the roster table.
 * @param {Array<{number: number, name: string, pos: string, shoots: string}>} players - List of players in the team.
 */
function updateRosterTable(players) {
  const table = document.querySelector(".roster-table");
  if (!table) {
    console.error("Roster table not found.");
    return;
  }

  // Wipe all row data but keep the rows themselves
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    row.innerHTML = `
      <td data-label="photo">
        <img src="images/000-placeholder.jpg" alt="Placeholder">
      </td>
      <td></td>
      <td></td>
      <td></td>
      <td>–</td>
      <td>–</td>
      <td>–</td>
      <td>–</td>
    `;
  }

  // Update rows (or add a row) for each player
  players.forEach((player, i) => {
    const row = table.rows[i + 1] || table.insertRow(-1);
    const imageURL = `images/${player.number}-${player.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.jpg`;

    // note: onerror, we should load images/000-placeholder.jpg
    row.innerHTML = `
      <td data-label="photo">
        <img src="${imageURL}" alt="${
      player.name
    }" onerror="this.onerror=null;this.src='images/000-placeholder.jpg';">
      </td>
      <td><a href="/player/?player=${player.name.replace(
        " ",
        "%20"
      )}" class="playername">${player.name}</a></td>
      <td>${player.number || ""}</td>
      <td>${player.pos || ""}</td>
      <td>–</td>
      <td>${player.shoots || "–"}</td>
      <td>–</td>
      <td>–</td>
    `;
  });
}

/**
 * Clears existing switcher content and populates the switchers for year/season and level.
 * Only includes levels that are available for the selected year/season.
 * @param {Object} data - The JSON data containing leagues information.
 */
function populateSwitchers(data) {
  const yearSeasonSwitcher = document.getElementById("yearSeasonSwitcher");
  const levelSwitcher = document.getElementById("levelSwitcher");
  yearSeasonSwitcher.innerHTML = "";
  levelSwitcher.innerHTML = "";

  let uniqueYearsSeasons = Array.from(
    new Set(data.leagues.map((league) => `${league.year} ${league.season}`))
  );

  // Define a season order for sorting
  const seasonOrder = ["Spring", "Summer", "Fall"];

  // Sort years in descending order and seasons by predefined order
  uniqueYearsSeasons = uniqueYearsSeasons.sort((a, b) => {
    const [yearA, seasonA] = a.split(" ");
    const [yearB, seasonB] = b.split(" ");

    if (yearA !== yearB) return yearB - yearA; // Descending years
    return seasonOrder.indexOf(seasonA) - seasonOrder.indexOf(seasonB); // Season order
  });

  uniqueYearsSeasons.forEach((yearSeason) => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = yearSeason;
    link.style.marginRight = "10px"; // Add some spacing between links
    if (`${window.poikas.year} ${window.poikas.season}` === yearSeason) {
      link.style.fontWeight = "bold"; // Bold the currently selected year/season
    }
    link.onclick = (e) => {
      e.preventDefault();
      updatePoikasYearSeason(yearSeason, data);
    };
    yearSeasonSwitcher.appendChild(link);
  });

  populateLevelSwitcher(data); // Call a separate function to handle level switcher
}

/**
 * Populates level switcher based on the current year and season selection.
 * @param {Object} data - The JSON data containing leagues information.
 */
function populateLevelSwitcher(data) {
  const levelSwitcher = document.getElementById("levelSwitcher");
  levelSwitcher.innerHTML = "";

  const { year, season } = window.poikas;
  const availableLevels = data.leagues
    .filter((league) => league.year === year && league.season === season)
    .map((league) => league.level);

  Array.from(new Set(availableLevels)).forEach((level) => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = level;
    link.style.marginRight = "10px"; // Add some spacing between links
    if (window.poikas.level === level) {
      link.style.fontWeight = "bold"; // Bold the currently selected level
    }
    link.onclick = (e) => {
      e.preventDefault();
      updatePoikasLevel(level);
    };
    levelSwitcher.appendChild(link);
  });
}

/**
 * Updates the global `window.poikas` object with the new year and season, then checks for available levels and possibly updates the level before reloading the roster.
 * @param {string} yearSeason - The selected year and season in "YYYY Season" format.
 * @param {Object} data - The JSON data for validation of available levels.
 */
function updatePoikasYearSeason(yearSeason, data) {
  const [year, season] = yearSeason.split(" ");
  window.poikas.year = parseInt(year);
  window.poikas.season = season;

  // Check and update the level if the current level is not available
  const availableLevels = data.leagues
    .filter(
      (league) => league.year === parseInt(year) && league.season === season
    )
    .map((league) => league.level);

  if (!availableLevels.includes(window.poikas.level)) {
    window.poikas.level = availableLevels.includes("C")
      ? "C"
      : availableLevels.includes("Rec")
      ? "Rec"
      : availableLevels[0];
  }

  loadAndDisplayRoster(); // Reload the roster with the new selection
}

/**
 * Updates the global `window.poikas` object with the new level, then reloads the roster.
 * @param {string} level - The selected level.
 */
function updatePoikasLevel(level) {
  window.poikas.level = level;
  loadAndDisplayRoster(); // Reload the roster with the new selection
}
