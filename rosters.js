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
async function loadAndDisplayRoster(selector, { year, season, level }) {
  const { leagues, players } = await loadRoster();

  players.sort((a, b) => (a.name < b.name ? -1 : 1)); // Sort players by name

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
  updateRosterTable(selector, rosterPlayers);
}

/**
 * Generates HTML table rows for each player and inserts them into the roster table.
 * @param {string>} selector - String selector for the table element.
 * @param {Array<{number: number, name: string, pos: string, shoots: string}>} players - List of players in the team.
 */
function updateRosterTable(selector, players) {
  const table = document.querySelector(selector);
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
      <td>–</td>
      <td>–</td>
      <td>–</td>
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

    const years = player.joined
      ? new Date().getFullYear() - player.joined
      : "–";
    const age = player.born ? new Date().getFullYear() - player.born - 1 : "–";

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
      <td>${player.number || "–"}</td>
      <td>${player.pos || "–"}</td>
      <td class="extra">${player.ht || "–"}</td>
      <td class="extra">${player.wt || "–"}</td>
      <td class="extra">${player.shoots || "–"}</td>
      <td class="extra">${years}</td>
      <td class="extra">${age}</td>
    `;
  });
}
