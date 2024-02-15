/**
 * Load all players from the database and display them in the given element.
 *
 * @param {String} elementQuery
 */
async function loadAllPlayers(elementQuery) {
  const data = await loadData();

  const table = document.querySelector(elementQuery);

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const sortedByActive = data.players.slice().sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return 0;
  });

  sortedByActive.forEach((player) => {
    const imageURL = `/images/${player.number}-${player.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.jpg`;

    const currentSeasons = player.seasons.filter((s) => s.current);
    const recSeason = currentSeasons.find((s) => s.level === "Rec");
    const cSeason = currentSeasons.find((s) => s.level === "C");
    const recLink = recSeason
      ? `<a href="/season/?year=${recSeason.year}&season=${recSeason.season}&level=${recSeason.level}">Rec</a>`
      : "-";
    const cLink = cSeason
      ? `<a href="/season/?year=${cSeason.year}&season=${cSeason.season}&level=${cSeason.level}">C/CC</a>`
      : "-";

    const tr = document.createElement("tr");
    if (!player.active) tr.classList.add("inactive");

    tr.innerHTML = `
      <td data-label="photo">
        <img src="${imageURL}" alt="${
      player.name
    }" onerror="this.onerror=null;this.src='/images/000-placeholder.jpg';">
      </td>
      <td><a href="/player/?player=${player.name}">${player.name}</a></td>
      <td>${player.pos || "-"}</td>
      <td>${player.number || "-"}</td>
      <td>${player.ht || "-"}</td>
      <td>${player.wt || "-"}</td>
      <td>${player.age || "-"}</td>
      <td>${recLink}</td>
      <td>${cLink}</td>
    `;
    tbody.appendChild(tr);
  });
}
