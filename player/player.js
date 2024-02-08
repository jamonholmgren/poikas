/**
 * @typedef {import('../types').Player} Player
 * @typedef {import('../types').RosterData} RosterData
 */

/**
 * Function to load player data and update the page.
 * Assumes `loadData()` returns a Promise that resolves to `RosterData`.
 * @param {string} playerName The name of the player to load information for.
 * @returns {Promise<void>} Nothing is returned from this function.
 */
async function loadPlayerInfo(playerName) {
  /**
   * @type {RosterData}
   */
  const data = await loadData();

  const player = data.players.find((p) => p.name === playerName);
  if (!player) throw new Error("Player not found.");

  // Update player information in the HTML
  const avatar = document.querySelector(".sidebar img");
  avatar.src = `/images/${player.number}-${player.name
    .toLowerCase()
    .replace(/\s+/g, "-")}.jpg`;
  avatar.onerror = function () {
    this.onerror = null;
    this.src = "/images/000-placeholder.jpg";
  };

  document.querySelector(
    ".sidebar .caption"
  ).textContent = `${player.name} Photo`;

  // grab #player-name by ID and set to player.name
  document.querySelector("#playername").textContent = player.name;
  document.querySelector("#bio").textContent = `${player.bio || "No bio yet!"}`; // Placeholder for player bio

  // Update player stats
  document.querySelectorAll("main table tr th").forEach((th, index) => {
    const td = th.nextElementSibling; // Assuming there's a <td> right after each <th>
    switch (th.textContent) {
      case "Position":
        td.textContent = player.pos || "—";
        break;
      case "Number":
        td.textContent = player.number || "—";
        break;
      case "Height":
        td.textContent = player.ht || "—";
        break;
      case "Weight":
        td.textContent = player.wt || "—";
        break;
      case "Shoots":
        td.textContent = player.shoots || "—";
        break;
      case "Joined":
        td.textContent = player.startYear || "—";
        break;
      case "Age":
        td.textContent = player.age || "—";
        break;
      case "Years":
        td.textContent = player.years || "—";
        break;
      case "Rec Seasons":
        td.textContent =
          player.seasons.filter((s) => s.level === "Rec").length || "—";
        break;
      case "C/CC Seasons":
        td.textContent =
          player.seasons.filter((s) => s.level === "C").length || "—";
        break;
      case "Championships":
        if (player.championships > 0) {
          td.innerHTML = `<span class="champion">${player.championships}`;
          for (let i = 0; i < player.championships; i++) {
            td.innerHTML += " 🏆";
          }
          td.innerHTML += "</span>";
        }
        break;
    }
  });

  // Display the seasons played
  loadAndDisplaySeasons("#seasons", { player: player.name });

  // Update the "Next" and "Previous" links

  // find next alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name < b.name ? -1 : 1));
  const nextPlayer = data.players.find((p) => p.name > playerName);

  // find previous alphabetical player (first sort it by name)
  data.players.sort((a, b) => (a.name > b.name ? -1 : 1));
  const prevPlayer = data.players.find((p) => p.name < playerName);

  const prevLink = document.getElementById("prev");
  const nextLink = document.getElementById("next");
  if (prevPlayer) {
    prevLink.href = `/player/?player=${prevPlayer.name}`;
    prevLink.textContent = prevPlayer.name;
  } else {
    prevLink.style.display = "none";
  }
  if (nextPlayer) {
    nextLink.href = `/player/?player=${nextPlayer.name}`;
    nextLink.textContent = nextPlayer.name;
  } else {
    nextLink.style.display = "none";
  }
}
