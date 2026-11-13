#!/usr/bin/env node
// `pnpm brands:sync`: copies the brands from packages/blocks/src/brands.tsx into every block that names them.
// A block keeps its own `brands` constant (so it's still one file to copy), with only the roles it uses: names alone
// (`{ payments: "Stripe" }`) when it only writes them, or name, colour and mark when it shows a logo. This rewrites
// each constant from the catalog, keeping the block's roles and its kind. `--check` changes nothing and lists the
// blocks out of step (exit code 1 if any).

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { argv, exit } from "node:process"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(root, "packages/blocks/src")
const catalogFile = join(src, "brands.tsx")
const check = argv.includes("--check")

// ── The catalog ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Every brand in the catalog by role: its name, colour, and its mark's lines exactly as written there. */
function readCatalog() {
  const text = readFileSync(catalogFile, "utf8")
  const body = text.slice(text.indexOf("export const brands = {"))
  const catalog = {}
  const role = /^ {2}(\w+): \{\n([\s\S]*?)^ {2}\},$/gm
  for (const [, name, block] of body.matchAll(role)) {
    const field = (key) => block.match(new RegExp(`^ {4}${key}: "([^"]*)",$`, "m"))?.[1]
    const mark = block.match(/^ {4}mark: \(\n([\s\S]*?)\n {4}\),$/m)?.[1]
    if (!field("name") || !field("color") || !mark) throw new Error(`brands.tsx: the ${name} brand needs a name, a color and a mark`)
    catalog[name] = { name: field("name"), color: field("color"), mark }
  }
  return catalog
}

// ── The blocks ───────────────────────────────────────────────────────────────────────────────────────────────────

function* blockFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* blockFiles(path)
    else if (path.endsWith(".tsx") && path !== catalogFile) yield path
  }
}

/** Where a block's `brands` constant starts and ends (its closing brace, matched), or null if it has none. */
function findConstant(text) {
  const start = text.indexOf("const brands = {")
  if (start < 0) return null
  let depth = 0
  for (let i = text.indexOf("{", start); i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}" && --depth === 0) return { start, end: i + 1 }
  }
  throw new Error("an unclosed brands constant")
}

/** The constant as the catalog says it should be, for these roles: names only, or with colours and marks. */
function render(roles, withMarks, catalog) {
  if (!withMarks) return `const brands = { ${roles.map((r) => `${r}: "${catalog[r].name}"`).join(", ")} }`
  const entries = roles.map((r) => {
    const b = catalog[r]
    return `  ${r}: {\n    name: "${b.name}",\n    color: "${b.color}",\n    mark: (\n${b.mark}\n    ),\n  },`
  })
  return `const brands = {\n${entries.join("\n")}\n}`
}

const catalog = readCatalog()
const changed = []
for (const file of blockFiles(src)) {
  const text = readFileSync(file, "utf8")
  const found = findConstant(text)
  if (!found) continue
  const current = text.slice(found.start, found.end)
  const withMarks = current.includes("mark:")
  // The roles it uses, in its own order: the top-level keys of the constant.
  const roles = withMarks ? [...current.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]) : [...current.matchAll(/(\w+): "/g)].map((m) => m[1])
  const unknown = roles.filter((r) => !catalog[r])
  if (unknown.length) throw new Error(`${relative(root, file)}: no brand in the catalog for ${unknown.join(", ")}`)
  const next = render(roles, withMarks, catalog)
  if (next === current) continue
  changed.push(relative(root, file))
  if (!check) writeFileSync(file, text.slice(0, found.start) + next + text.slice(found.end))
}

if (check && changed.length) {
  console.log(`Out of step with brands.tsx (run pnpm brands:sync):\n${changed.map((f) => `  ${f}`).join("\n")}`)
  exit(1)
}
console.log(changed.length ? `${check ? "Out of step" : "Updated"}: ${changed.join(", ")}` : "Every block's brands match brands.tsx.")
