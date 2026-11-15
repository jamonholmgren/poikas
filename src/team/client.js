/* Small, phone-first UI. The server owns identity, permissions and every save. */
const app = document.querySelector("#app")
const notice = document.querySelector("#notice")
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
let state,
  selectedPlayer = "",
  busy = false
let setupToken = location.pathname === "/team/setup" ? location.hash.slice(1) : ""
if (setupToken) history.replaceState(null, "", "/team/setup")
let period = "upcoming",
  gameTab = "attendance"
const flash = (message, error = false) => {
  notice.textContent = message
  notice.className = error ? "error visible" : "visible"
  clearTimeout(flash.timer)
  flash.timer = setTimeout(() => (notice.className = ""), 6000)
}
async function post(path, value) {
  const res = await fetch("/team/api/" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Could not save. Please try again.")
  return data
}
async function load() {
  try {
    const res = await fetch("/team/api/state" + location.search, { cache: "no-store" })
    state = await res.json()
    if (!res.ok) throw new Error(state.error)
    render()
    app.setAttribute("aria-busy", "false")
  } catch (e) {
    app.innerHTML = `<section class="panel"><h1>Couldn’t load the team room</h1><p>${esc(e.message)}</p><button id="retry">Try again</button></section>`
    document.querySelector("#retry").onclick = load
  }
}
function go(path) {
  selectedPlayer = ""
  gameTab = "attendance"
  history.pushState(null, "", path)
  load()
  window.scrollTo(0, 0)
}
window.onpopstate = () => {
  selectedPlayer = ""
  load()
}
const dateLabel = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"))
    : "Date unrecorded"
const gameLink = (key) => "/team?game=" + encodeURIComponent(key)
const displayTime = (game) => (game.time ? game.time + " Pacific" : "Time not listed — check MVIA")
const rowName = (id) => state.game?.attendance.find((p) => p.id === id)?.name || id
function render() {
  if (setupToken) {
    app.innerHTML = `<section class="login panel"><p class="eyebrow">WELCOME TO THE TEAM</p><h1>Choose your PIN.</h1><p>Three digits. Your phone will remember you.</p><form id="setup"><label>New PIN<input name="pin" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" minlength="3" type="password" autocomplete="new-password" required></label><label>Repeat PIN<input name="repeat" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" type="password" autocomplete="new-password" required></label><button>Save PIN & sign in</button></form></section>`
    bind()
    return
  }
  if (!state.me) {
    const admin = location.pathname === "/team/admin"
    app.innerHTML = `<section class="login panel"><p class="eyebrow">SUOMI POIKAS · REC + CC</p><h1>${admin ? "Admin sign in." : "See you at the rink."}</h1><p>${admin ? "Manage attendance, lines and player PINs." : "Check in, see the roster, and get ready for game night."}</p>${state.enabled ? "" : '<p class="alert">Team setup is in progress. Check back soon.</p>'}
    <form id="${admin ? "admin-login" : "login"}">${admin ? '<label>Admin password<input name="password" type="password" autocomplete="current-password" required></label>' : `<label>Your player<select name="player" required><option value="">Choose your name</option>${state.players.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></label><label>Three-digit PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" minlength="3" autocomplete="current-password" required></label>`}<button ${!state.enabled ? "disabled" : ""}>Sign in</button></form>
    <p class="muted">${admin ? '<a href="/team" data-nav>Player sign in</a>' : "First time or forgot your PIN? Ask the admin to text you a setup link."}</p>${admin ? "" : '<a class="quiet" href="/team/admin" data-nav>Admin sign in</a>'}</section>`
    bind()
    return
  }
  const nav = `<div class="account"><span>${esc(state.me.name)}</span><div>${state.me.admin ? '<a href="/team/admin" data-nav>Admin</a> · ' : ""}<button class="text-button" data-logout>Sign out</button></div></div>`
  if (location.pathname === "/team/admin" && state.me.admin) {
    app.innerHTML = nav + adminPage()
    bind()
    return
  }
  if (state.game) {
    app.innerHTML = nav + gamePage()
    bind()
    return
  }
  const season = state.seasons.find((s) => s.key === state.selectedSeason)
  let games = state.games.filter((g) =>
    period === "upcoming" ? g.date >= state.today && g.result === "pending" && !g.cancelled : g.date < state.today || g.result !== "pending" || g.cancelled,
  )
  if (period === "past") games = games.toReversed()
  app.innerHTML =
    nav +
    `<section class="intro"><p class="eyebrow">THE NEXT SHIFT STARTS HERE</p><h1>Game nights.</h1><p>Let the team know you’re coming.</p></section><div class="filters"><div class="segmented">${["Rec", "CC"].map((l) => `<button class="${season?.league === l ? "active" : ""}" data-team="${l}">${l}</button>`).join("")}</div><label class="season-picker"><span class="sr-only">Season</span><select id="season">${state.seasons
      .filter((s) => s.league === season?.league)
      .map((s) => `<option value="${esc(s.key)}" ${s.key === state.selectedSeason ? "selected" : ""}>${esc(s.name)}</option>`)
      .join(
        "",
      )}</select></label></div><div class="tabs"><button data-period="upcoming" class="${period === "upcoming" ? "active" : ""}">Upcoming</button><button data-period="past" class="${period === "past" ? "active" : ""}">Past games</button></div><div class="game-list">${games.length ? games.map((g) => `<a class="game-card" href="${gameLink(g.key)}" data-nav><div><p class="eyebrow">${esc(g.league)} · ${esc(dateLabel(g.date))}</p><h2>vs ${esc(g.vs)}</h2><p>${g.cancelled ? "Cancelled" : esc(displayTime(g))}${g.score ? " · " + esc(g.score) : ""}</p>${g.changedAt ? '<span class="change">Schedule updated</span>' : ""}</div><div class="game-count"><strong>${g.in}</strong><span>IN</span><small>${g.unknown} unanswered</small></div><span class="arrow">↗</span></a>`).join("") : '<section class="panel"><h2>No games here yet.</h2><p>Try the other team or season.</p></section>'}</div>${syncInfo()}`
  bind()
}
function syncInfo() {
  return `<p class="sync">Times are Pacific · MVIA refreshes daily at 10 a.m.<br>${state.sync.lastSuccess ? "Last refreshed " + esc(new Date(state.sync.lastSuccess).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })) + " Pacific" : "Using the saved schedule."}${state.sync.error ? " · Refresh unavailable; keeping the saved schedule." : ""}</p>`
}
function gamePage() {
  const g = state.game,
    me = g.attendance.find((p) => p.id === state.me.player),
    inPlayers = g.attendance.filter((p) => p.status === "in"),
    myNote = me?.note || ""
  return `<a class="back" href="/team?season=${esc(state.selectedSeason)}" data-nav>← All games</a><section class="game-hero"><p class="eyebrow">${esc(g.league)} · ${esc(dateLabel(g.date))}</p><h1>Poikas <span>vs</span><br>${esc(g.vs)}</h1><p class="time">${g.cancelled ? "Cancelled" : esc(displayTime(g))}${g.score ? " · " + esc(g.score) : ""}</p>${g.changedAt ? '<p class="alert">MVIA has updated this game’s schedule. The time above is the latest saved time.</p>' : ""}<button class="secondary" id="reminder">Copy reminder & link</button></section><div class="tabs"><button data-game-tab="attendance" class="${gameTab === "attendance" ? "active" : ""}">Attendance</button><button data-game-tab="lines" class="${gameTab === "lines" ? "active" : ""}">Lines</button></div><div ${gameTab === "attendance" ? "" : "hidden"}>
  ${me ? `<section class="panel my-response"><div class="section-heading"><h2>You’re ${me.status === "unknown" ? "not checked in yet" : me.status === "in" ? "in ✓" : "out"}.</h2>${me.recorded ? '<span class="pill">Stats recorded</span>' : ""}</div><form id="attendance"><div class="answer-buttons"><button name="status" value="in" class="${me.status === "in" ? "chosen-in" : "secondary"}" ${g.cancelled ? "disabled" : ""}>✓ I’m in</button><button name="status" value="out" class="${me.status === "out" ? "chosen-out" : "secondary"}" ${me.recorded || g.cancelled ? "disabled" : ""}>I’m out</button></div><label>Optional note<textarea name="note" maxlength="300" placeholder="Running late, need a ride…">${esc(myNote)}</textarea></label><p class="muted">${me.recorded ? "Your game stats count you as In." : "Tap In or Out to save your response and note."}</p></form></section>` : state.me.admin ? "" : '<p class="alert">You’re not on this game’s roster. Ask the admin to add you as a fill-in.</p>'}
  <section class="panel"><div class="section-heading"><h2>The roster</h2><span class="pill">${inPlayers.filter((p) => !p.goalie).length} skaters · ${inPlayers.filter((p) => p.goalie).length} goalies in</span></div><div class="roster-summary"><span><b>${g.in}</b> In</span><span><b>${g.out}</b> Out</span><span><b>${g.unknown}</b> No answer</span></div>${[
    "in",
    "unknown",
    "out",
  ]
    .map(
      (status) =>
        `<h3 class="group-label">${{ in: "IN", out: "OUT", unknown: "NOT ANSWERED" }[status]}</h3><div class="roster-rows">${
          g.attendance
            .filter((p) => p.status === status)
            .map(
              (p) =>
                `<div class="player-row"><div><strong>${esc(p.name)}</strong>${p.goalie ? '<span class="badge">G</span>' : ""}${p.recorded ? '<small class="recorded">Stats recorded</small>' : ""}${p.note ? `<p class="player-note">${esc(p.note)}</p>` : ""}</div>${state.me.admin ? `<button class="small secondary" data-edit="${esc(p.id)}">Edit</button>` : ""}</div>`,
            )
            .join("") || '<p class="muted">None</p>'
        }</div>`,
    )
    .join(
      "",
    )}${state.me.admin ? '<form id="guest" class="inline-form"><label>Add a fill-in for this game<input name="name" list="known-players" maxlength="80" placeholder="Player’s full name" required></label><button class="secondary">Add</button></form>' : ""}</section>
  </div><section class="panel" ${gameTab === "lines" ? "" : "hidden"}><div class="section-heading"><h2>Lines</h2><button class="small secondary" id="copy-lines">Copy lines</button></div>${
    state.me.admin
      ? `<p class="muted">Tap a player, then a spot. Tap a filled spot to return them to the bench. Changes save immediately.</p><div class="bench">${
          inPlayers
            .filter((p) => !Object.values(g.lines).includes(p.id))
            .map((p) => `<button class="player-chip ${selectedPlayer === p.id ? "selected" : ""}" data-pick="${esc(p.id)}">${esc(p.name)}</button>`)
            .join("") || '<p class="muted">Everyone is assigned, or no players are in yet.</p>'
        }</div>`
      : ""
  }
  <h3 class="group-label">FORWARDS</h3>${Array.from({ length: 4 }, (_, i) => `<div class="line-row"><span class="line-label">${i + 1}</span>${["LW", "C", "RW"].map((p) => lineSlot(`F${i + 1}-${p}`, p)).join("")}</div>`).join("")}<h3 class="group-label">DEFENSE</h3>${Array.from({ length: 3 }, (_, i) => `<div class="line-row defense"><span class="line-label">${i + 1}</span>${["LD", "RD"].map((p) => lineSlot(`D${i + 1}-${p}`, p)).join("")}</div>`).join("")}<h3 class="group-label">GOALIE</h3><div class="goalie-slot">${lineSlot("G", "G")}</div></section><datalist id="known-players">${(state.players || []).map((p) => `<option value="${esc(p.name)}"></option>`).join("")}</datalist>${syncInfo()}`
}
function lineSlot(slot, label) {
  const id = state.game.lines[slot],
    p = state.game.attendance.find((p) => p.id === id)
  return `<button class="line-slot ${p ? "filled" : ""} ${p && p.status !== "in" ? "unavailable" : ""}" data-slot="${slot}" ${!state.me.admin ? "disabled" : ""}><small>${label}</small><span>${p ? esc(p.name) : "—"}</span>${p && p.status !== "in" ? "<small>Not checked in</small>" : ""}</button>`
}
function adminPage() {
  return `<a class="back" href="/team" data-nav>← Games & lines</a><section class="intro"><p class="eyebrow">KEEP IT SIMPLE</p><h1>Team admin.</h1></section><section class="panel"><h2>Player PINs</h2><p>Copy a private setup/reset link and text it to the player. Links expire after one day and work once.</p><label>Player<select id="reset-player">${state.players.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}${p.hasPin ? "" : " · needs PIN"}</option>`).join("")}</select></label><button id="reset-pin">Copy PIN setup/reset link</button><div id="copy-fallback"></div></section><section class="panel"><h2>Add a roster player</h2><p>For a one-game fill-in, open that game and use “Add a fill-in.”</p><form id="roster"><label>Team<select name="league"><option>Rec</option><option>CC</option></select></label><label>Player’s full name<input name="name" list="admin-player-names" maxlength="80" required></label><button class="secondary">Add to roster</button></form><datalist id="admin-player-names">${state.players.map((p) => `<option value="${esc(p.name)}"></option>`).join("")}</datalist></section><section class="panel"><h2>Schedule</h2><p>Refreshes every day at 10 a.m. Pacific. Existing check-ins and lines stay with a rescheduled game.</p><button class="secondary" id="sync">Refresh from MVIA now</button>${syncInfo()}</section><section class="panel"><h2>Private backups</h2><p>Download one file with attendance, notes, lines, and login settings. Keep it private. The server keeps 30 daily backups.</p><a class="button" href="/team/api/backup" download>Download backup</a><form id="restore"><label>Restore a downloaded backup<input type="file" name="backup" accept="application/json,.json" required></label><p class="muted">Restoring replaces team-room data and logs everyone out. Game stats are separate.</p><button class="secondary">Restore backup</button></form></section><section class="panel"><h2>Admin password</h2><form id="password"><label>New password · at least 16 characters<input name="password" type="password" minlength="16" maxlength="200" autocomplete="new-password" required></label><button class="secondary">Change password</button></form></section>`
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    flash("Copied. Ready to paste into your text.")
  } catch {
    const box = document.createElement("textarea")
    box.value = text
    box.readOnly = true
    box.className = "copy-box"
    ;(document.querySelector("#copy-fallback") || app).append(box)
    box.select()
    flash("Select and copy the text shown.")
  }
}
function bind() {
  document.querySelectorAll("[data-nav]").forEach(
    (a) =>
      (a.onclick = (e) => {
        e.preventDefault()
        go(a.getAttribute("href"))
      }),
  )
  document.querySelectorAll("[data-logout]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          await post("logout", {})
          go("/team")
        })),
  )
  document.querySelectorAll("[data-team]").forEach((b) => (b.onclick = () => go("/team?league=" + b.dataset.team)))
  document.querySelectorAll("[data-game-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        gameTab = b.dataset.gameTab
        render()
      }),
  )
  document.querySelectorAll("[data-period]").forEach(
    (b) =>
      (b.onclick = () => {
        period = b.dataset.period
        render()
      }),
  )
  const season = document.querySelector("#season")
  if (season) season.onchange = () => go("/team?season=" + encodeURIComponent(season.value))
  const form = (id, fn) => {
    const el = document.getElementById(id)
    if (el)
      el.onsubmit = (e) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(el))
        act(() => fn(data, e, el))
      }
  }
  form("login", async (b) => {
    await post("login", b)
    await load()
  })
  form("admin-login", async (b) => {
    await post("admin-login", b)
    await load()
  })
  form("setup", async (b) => {
    if (b.pin !== b.repeat) throw new Error("The PINs do not match.")
    await post("setup", { pin: b.pin, token: setupToken })
    setupToken = ""
    go("/team")
  })
  form("attendance", async (b, e) => {
    await post("attendance", { game: state.game.key, note: b.note, status: e.submitter.value })
    flash("Saved.")
    await load()
  })
  form("guest", async (b) => {
    await post("add-player", { name: b.name, game: state.game.key })
    flash("Fill-in added. Mark them In or Out with Edit.")
    await load()
  })
  form("roster", async (b) => {
    await post("add-player", b)
    flash("Player added.")
    await load()
  })
  form("password", async (b) => {
    await post("admin-password", b)
    flash("Password changed.")
    await load()
  })
  form("restore", async (b, e, el) => {
    const file = el.querySelector("input").files[0]
    if (!confirm("Replace team-room data with this backup? Everyone will need to sign in again.")) return
    await post("restore", { backup: JSON.parse(await file.text()) })
    flash("Backup restored. Sign in again.")
    go("/team/admin")
  })
  const on = (id, fn) => {
    const b = document.getElementById(id)
    if (b) b.onclick = () => act(fn)
  }
  on("reset-pin", async () => {
    const r = await post("reset-pin", { player: document.querySelector("#reset-player").value })
    await copy(r.link)
  })
  on("sync", async () => {
    flash("Refreshing MVIA…")
    await post("sync", {})
    flash("Schedule refreshed.")
    await load()
  })
  on("reminder", async () => {
    const g = state.game
    await copy(`Poikas ${g.league} vs ${g.vs} — ${dateLabel(g.date)}, ${displayTime(g)}. Please check In or Out: ${location.origin}${gameLink(g.key)}`)
  })
  on("copy-lines", async () => {
    const g = state.game
    const rows = Object.entries(g.lines).map(([slot, id]) => `${slot}: ${rowName(id)}`)
    await copy(`Poikas ${g.league} vs ${g.vs} · ${dateLabel(g.date)}\n${rows.join("\n") || "Lines not set yet."}\n${location.origin}${gameLink(g.key)}`)
  })
  document.querySelectorAll("[data-pick]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedPlayer = selectedPlayer === b.dataset.pick ? "" : b.dataset.pick
        render()
      }),
  )
  document.querySelectorAll("[data-slot]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          const available = state.game.attendance.filter((p) => p.status === "in").map((p) => p.id)
          const lines = Object.fromEntries(Object.entries(state.game.lines).filter(([, id]) => available.includes(id)))
          if (selectedPlayer) {
            for (const key of Object.keys(lines)) if (lines[key] === selectedPlayer) delete lines[key]
            lines[b.dataset.slot] = selectedPlayer
          } else delete lines[b.dataset.slot]
          await post("lines", { game: state.game.key, lines, revision: state.game.revision })
          selectedPlayer = ""
          await load()
          flash("Lines saved.")
        })),
  )
  document.querySelectorAll("[data-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.game.attendance.find((p) => p.id === b.dataset.edit)
        const dialog = document.createElement("dialog")
        dialog.innerHTML = `<form id="admin-attendance"><h2>${esc(p.name)}</h2><label>Status<select name="status"><option value="in" ${p.status === "in" ? "selected" : ""}>In</option><option value="out" ${p.status === "out" ? "selected" : ""} ${p.recorded ? "disabled" : ""}>Out</option></select></label><label>Optional note<textarea name="note" maxlength="300">${esc(p.note)}</textarea></label><div class="answer-buttons"><button>Save</button><button type="button" class="secondary" id="close-dialog">Cancel</button></div></form>`
        document.body.append(dialog)
        dialog.showModal()
        dialog.querySelector("#close-dialog").onclick = () => dialog.remove()
        dialog.querySelector("form").onsubmit = (e) => {
          e.preventDefault()
          act(async () => {
            const data = Object.fromEntries(new FormData(e.target))
            await post("attendance", { ...data, game: state.game.key, player: p.id })
            dialog.remove()
            await load()
            flash("Saved.")
          })
        }
      }),
  )
}
async function act(fn) {
  if (busy) return
  busy = true
  try {
    await fn()
  } catch (e) {
    flash(e.message, true)
  } finally {
    busy = false
  }
}
load()
