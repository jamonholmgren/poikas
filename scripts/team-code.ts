import { readFileSync } from "node:fs"
import { JsonStore, blankAuth } from "../src/team/store"
const [dir, codeFile] = process.argv.slice(2)
if (!dir?.startsWith("/") || !codeFile) throw new Error("Usage: bun scripts/team-code.ts /absolute/private/data /private/team-code-file")
const code = readFileSync(codeFile, "utf8").trim()
if (code.length < 4 || code.length > 32) throw new Error("Team code must contain 4 to 32 characters.")
const store = new JsonStore(dir)
if (store.auth().teamCodeHash) throw new Error("Team code already exists. Change it from the admin page.")
const hash = Bun.password.hashSync(code)
store.change("auth", blankAuth, (a) => {
  a.teamCodeHash = hash
})
console.log("Team code initialized. Code and hash were not printed.")
