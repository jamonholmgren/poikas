/**
 * Load all players from the database and display them in the given element.
 *
 * @param {String} elementQuery
 */
async function loadAllPlayers(elementQuery) {
  const data = await loadData();

  const table = $(elementQuery);

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const sortedByActive = data.players.slice().sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return 0;
  });

  sortedByActive.forEach((player) => {
    tbody.appendChild(tr);
  });
}
