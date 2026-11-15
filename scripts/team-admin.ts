import { readFileSync } from "node:fs"
import { JsonStore, blankAuth } from "../src/team/store"
// Run on the server against the configured persistent directory. Never put a password in shell history.
const [dir, passwordFile] = process.argv.slice(2)
if (!dir?.startsWith("/") || !passwordFile) throw new Error("Usage: bun scripts/team-admin.ts /absolute/private/data /private/password-file")
const password = readFileSync(passwordFile, "utf8").trim()
if (password.length < 16) throw new Error("Admin password must contain at least 16 characters.")
const store = new JsonStore(dir)
if (store.auth().adminHash) throw new Error("Admin already exists. Change the password using the admin page.")
const hash = Bun.password.hashSync(password)
store.change("auth", blankAuth, (a) => {
  a.adminHash = hash
})
console.log("Admin initialized. Password and hash were not printed.")
