document.addEventListener("DOMContentLoaded", function () {
  // Function to extract the player's name from the URL
  function getPlayerNameFromUrl() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get("player");
  }

  // Function to load player data and update the page
  async function loadPlayerInfo() {
    const playerName = getPlayerNameFromUrl();
    if (!playerName) {
      console.error("Player name not specified in the URL.");
      return;
    }

    const response = await fetch("/poikas.json");
    if (!response.ok) throw new Error("Failed to load player data.");

    const data = await response.json();
    const player = data.players.find((p) => p.name === playerName);
    if (!player) throw new Error("Player not found.");

    // find next alphabetical player (first sort it by name)
    data.players.sort((a, b) => (a.name < b.name ? -1 : 1));
    const nextPlayer = data.players.find((p) => p.name > playerName);
    // find previous alphabetical player (first sort it by name)
    data.players.sort((a, b) => (a.name > b.name ? -1 : 1));
    const prevPlayer = data.players.find((p) => p.name < playerName);

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
    document.querySelector("main article h2").textContent = player.name;
    document.querySelector(
      "main article p"
    ).textContent = `${player.name}'s bio goes here.`; // Placeholder for player bio

    // Update player stats
    document.querySelectorAll("main table tr th").forEach((th, index) => {
      const td = th.nextElementSibling; // Assuming there's a <td> right after each <th>
      switch (th.textContent) {
        case "Position":
          td.textContent = player.pos || "N/A";
          break;
        case "Number":
          td.textContent = player.number || "N/A";
          break;
        case "Height":
          td.textContent = "N/A"; // You'll need actual data
        case "Weight":
          td.textContent = "N/A"; // You'll need actual data
        case "Shoots":
          td.textContent = player.shoots || "N/A";
          break;
        case "Joined":
          td.textContent = "N/A"; // You'll need actual data
        case "Born":
          td.textContent = "N/A"; // You'll need actual data
      }
    });

    // Display the seasons played
    const seasonsTable = document.querySelector(".seasons-table");
    data.leagues.forEach((league) => {
      if (league.roster.includes(playerName)) {
        const row = seasonsTable.insertRow();
        row.innerHTML = `<td>${league.year}</td><td>${league.season}</td><td>${league.level}</td>`;
      }
    });

    // Update the "Next" and "Previous" links
    /**
     * <div class="prevnext">
          <a href="." id="prev">Previous Player</a>
          <a href="." id="next">Next Player</a>
        </div>
     */
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

  loadPlayerInfo();
});
