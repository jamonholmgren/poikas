/**
 * Loads and displays seasons and their leagues in a table.
 * @param {string} selector The selector for the table to update.
 */
async function loadAndDisplaySeasons(selector, options = {}) {
  const response = await fetch("/poikas.json"); // Adjust the path as needed
  if (!response.ok) throw new Error("Failed to load data.");

  const data = await loadData();
  let leagues = data.leagues.slice(); // dup so we don't modify the original data

  if (options.order === "desc") {
    leagues.reverse();
  }

  // Organize data by season
  const seasonsMap = leagues.reduce((acc, league) => {
    if (options.player) {
      const playerInRoster = league.roster.includes(options.player);
      if (!playerInRoster) return acc;
    }

    const key = `${league.year} ${league.season}`;
    if (!acc[key]) acc[key] = { rec: "", c: "" };

    const leagueUrl = `/season/?year=${
      league.year
    }&season=${league.season.toLowerCase()}&level=${league.level.toLowerCase()}`;
    let leagueText = league.level === "Rec" ? "Rec League" : "C/CC League";
    if (league.playoffs === "champions") {
      leagueText += ` 🏆`;
    }

    leagueText = `<a href="${leagueUrl}">${leagueText}</a>`;

    if (league.aside) {
      leagueText += `<span class='extra'> (${league.aside})</span>`;
    }

    if (league.level === "Rec") {
      acc[key].rec = leagueText;
    } else if (["C", "CC"].includes(league.level)) {
      acc[key].c = leagueText;
    }

    return acc;
  }, {});

  const seasonsTable = document.querySelector(selector);
  if (!seasonsTable) throw new Error("Table not found.");

  // Create table rows for each season
  Object.entries(seasonsMap).forEach(([season, leagues]) => {
    const row = seasonsTable.insertRow();
    row.innerHTML = `
        <td>${season}</td>
        <td>${leagues.rec || "–"}</td>
        <td>${leagues.c || "–"}</td>
      `;
  });
}
