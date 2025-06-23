// Table sorting functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get all tables with the 'roster' class
  const tables = document.querySelectorAll("table.roster")

  tables.forEach((table) => {
    const headers = table.querySelectorAll("th")

    headers.forEach((header, index) => {
      // Skip the photo column
      if (header.textContent === "Photo") return

      // Create and add sort indicator
      const sortIndicator = document.createElement("span")
      sortIndicator.className = "sort-indicator"
      sortIndicator.textContent = "↕"
      header.appendChild(sortIndicator)

      // Make headers clickable
      header.style.cursor = "pointer"

      header.addEventListener("click", () => {
        // Get the current sort direction
        const currentDirection = header.getAttribute("data-sort") || "none"
        const newDirection = currentDirection === "desc" ? "asc" : "desc"

        // Reset all headers
        headers.forEach((h) => {
          h.setAttribute("data-sort", "none")
          const indicator = h.querySelector(".sort-indicator")
          if (indicator) {
            indicator.textContent = "↕"
          }
        })

        // Set the new sort direction
        header.setAttribute("data-sort", newDirection)
        const currentIndicator = header.querySelector(".sort-indicator")
        if (currentIndicator) {
          currentIndicator.textContent = newDirection === "asc" ? "↑" : "↓"
        }

        // Get the table body
        const tbody = table.querySelector("tbody")
        const rows = Array.from(tbody.querySelectorAll("tr"))

        // Sort the rows
        rows.sort((a, b) => {
          const aValue = a.children[index].textContent.trim()
          const bValue = b.children[index].textContent.trim()

          // Handle dates if the header contains "Date"
          if (header.textContent.includes("Date")) {
            const aDate = new Date(aValue)
            const bDate = new Date(bValue)
            if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
              return newDirection === "asc" ? aDate - bDate : bDate - aDate
            }
          }

          // Handle numeric values
          const aNum = parseFloat(aValue)
          const bNum = parseFloat(bValue)

          // Handle heights (6-4, 5-9, etc)
          if (aValue.includes("-") && bValue.includes("-")) {
            const aParts = aValue.split("-")
            const bParts = bValue.split("-")
            const aFeet = parseInt(aParts[0])
            const aInches = parseInt(aParts[1])
            const bFeet = parseInt(bParts[0])
            const bInches = parseInt(bParts[1])

            if (!isNaN(aFeet) && !isNaN(aInches) && !isNaN(bFeet) && !isNaN(bInches)) {
              const aHeight = aFeet * 12 + aInches
              const bHeight = bFeet * 12 + bInches
              return newDirection === "asc" ? aHeight - bHeight : bHeight - aHeight
            }
          }

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return newDirection === "asc" ? aNum - bNum : bNum - aNum
          }

          // Handle text
          return newDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        })

        // Reorder the rows
        rows.forEach((row) => tbody.appendChild(row))
      })
    })
  })
})
