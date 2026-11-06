#!/usr/bin/env node
// `pnpm dashral init`: turns a fresh clone of the dashboard (apps/demo) into the start of your own app. It keeps one
// template or both, keeps the demo pages or swaps them for a blank page, keeps three languages or English only, keeps
// or drops the theme customizer, and writes your name and look into the code. Run it once, before you change anything.
//
// Every answer is also a flag, so it runs without questions too (the customizer's "Copy setup command" writes one):
//   pnpm dashral init --template inset --pages blank --languages en --customizer remove --name "Acme" --primary indigo
//
// In Dashral Pro it also picks the apps to keep (Analytics, Services, E-commerce, CRM, Kanban, Calendar, Chat):
//   pnpm dashral init --apps crm,kanban --samples remove --name "Acme"
//
// `pnpm dashral update` brings a later release into a project set up this way (see Updates below).
//
// How it edits the code: blocks between `@dashral-if <feature>` and `@dashral-end` comments are kept or dropped
// (features: classic, inset, switcher, i18n, customizer, demo, and app-<name> in Pro; blocks may nest); files and
// folders are moved or deleted; imports left unused are removed; and components/ or lib/ files nothing imports any
// more are deleted.

import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { argv, exit, stdin, stdout } from "node:process"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

// DASHRAL_ROOT: another copy to work on (`update` redoes the setup on a release, in a folder of its own).
const root = process.env.DASHRAL_ROOT ? resolve(process.env.DASHRAL_ROOT) : resolve(dirname(fileURLToPath(import.meta.url)), "..")
const app = join(root, "apps/demo")
const record = join(root, ".dashral.json")
const themeKeys = ["primary", "light", "dark", "card", "radius", "font"]
/** Dashral Pro's dashboard has lib/edition.ts; the free one doesn't. */
const pro = existsSync(join(app, "lib/edition.ts"))
/** Pro's apps and where each opens. Each lives in its own folders (docs/ARCHITECTURE.md → Remove a feature). */
const proApps = { analytics: "/analytics", services: "/services", ecommerce: "/ecommerce", crm: "/crm", kanban: "/kanban", calendar: "/calendar", chat: "/chat" }
/** Classic's sample pages in app/(dashboard), each in a folder of its own: Inset only and blank pages leave them out. */
const classicPages = ["files", "finance", "projects", "support", "inventory", "monitoring", "getting-started"]
/** Classic's sample pages with a frame of their own, beside app/(dashboard): the full-page AI assistant. */
const classicFramed = ["app/(assistant)"]

// ── Arguments ────────────────────────────────────────────────────────────────────────────────────────────────────

function parseArgs(args) {
  const flags = {}
  const rest = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg.startsWith("--")) {
      rest.push(arg)
      continue
    }
    const [key, inline] = arg.slice(2).split(/=(.*)/s)
    if (inline !== undefined) flags[key] = inline
    else if (args[i + 1] !== undefined && !args[i + 1].startsWith("--")) flags[key] = args[++i]
    else flags[key] = true
  }
  return { command: rest[0], flags }
}

const help = `Usage: pnpm dashral init [options]

  --template    classic | inset | both     Which dashboard template to keep (default: classic)
  --pages       demo | blank               Keep the demo pages, or start from a blank page (default: demo)
  --languages   all | en                   English, Indonesian and Arabic, or English only (default: all)
  --customizer  keep | remove              The theme customizer in the header (default: keep)
  --name        "Your App"                 Your app's name, shown everywhere the template's was
  --primary, --light, --dark, --card, --radius, --font
                                           The look your app starts with (the customizer's options)
  --layout      monorepo | flat            Keep this repository's layout (default), or make the app a project of its
                                           own, like a new Next.js app: @dashral/ui from npm, no packages or
                                           workspace. A flat app updates its components with \`pnpm up @dashral/ui\`;
                                           \`pnpm dashral update\` needs the monorepo. \`npx create-dashral\` makes flat.
  --yes                                    Use the defaults for anything not given; ask nothing
  --force                                  Run even with uncommitted changes

In Dashral Pro, instead of --template and --pages:
  --apps        all | crm,kanban,…         The apps to keep: ${Object.keys(proApps).join(", ")}
  --samples     keep | remove              The pages of sample data: Overview, the Inset template, Files,
                                           Pricing and the error pages

Run it once, in a fresh clone, before changing the code.

Usage: pnpm dashral update [--from <url>] [--release v1.2.0 | --branch main]

  Brings the latest release (the repository's newest version tag) into a project init set up: merges it, keeps what
  you removed removed, and fits its database migrations to your apps. --release picks an earlier one; --branch brings
  in a branch's unreleased work instead. --from is needed only when .dashral.json doesn't know the repository (it
  remembers the one you cloned). Fix any conflicts it leaves, then: pnpm dashral update --continue`

// ── Small file helpers ───────────────────────────────────────────────────────────────────────────────────────────

const touched = new Set()
const read = (path) => readFileSync(path, "utf8")
function write(path, text) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
  touched.add(path)
}
function remove(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true })
}
/** Replaces `from` with `to` in a file, and stops with an error if it isn't there: the code changed under the script. */
function patch(path, from, to) {
  const text = read(path)
  const next = typeof from === "string" ? (text.includes(from) ? text.replace(from, to) : null) : from.test(text) ? text.replace(from, to) : null
  if (next === null) fail(`Couldn't find the expected code in ${relative(root, path)}: ${String(from).slice(0, 80)}`)
  write(path, next)
}
function walk(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}
const codeFiles = (...dirs) => dirs.flatMap((dir) => walk(join(app, dir))).filter((path) => /\.(tsx?|css|mjs)$/.test(path))
function removeEmptyDirs(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return
  for (const entry of readdirSync(dir)) removeEmptyDirs(join(dir, entry))
  if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true })
}
function fail(message) {
  console.error(`\n✖ ${message}`)
  exit(1)
}

// ── Questions ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The customizer's options, read from the kit (packages/ui/src/lib/themes.ts) so the two never disagree. */
function readThemeOptions() {
  const source = read(join(root, "packages/ui/src/lib/themes.ts"))
  const block = source.slice(source.indexOf("export const themeOptions"), source.indexOf("} as const"))
  const options = {}
  for (const key of themeKeys) {
    const list = block.slice(block.indexOf(`${key}: [`))
    options[key] = [...list.slice(0, list.indexOf("]")).matchAll(/value: "([^"]+)"/g)].map((match) => match[1])
  }
  return options
}

/** A template's starting look: defaultThemeSettings, with the template's own picks (lib/templates.ts) over it. */
function readThemeDefaults(template) {
  const source = read(join(app, "lib/theme-settings.ts"))
  const block = /export const defaultThemeSettings: ThemeSettings = \{([\s\S]*?)\n\}/.exec(source)?.[1] ?? ""
  const pairs = (text) => Object.fromEntries([...text.matchAll(/(\w+): "([^"]+)"/g)].map((match) => [match[1], match[2]]))
  const own = new RegExp(`\\n  ${template}: \\{[^\\n]*theme: \\{([^}]*)\\}`).exec(read(join(app, "lib/templates.ts")))?.[1] ?? ""
  return { ...pairs(block), ...pairs(own) }
}

async function ask(flags, themeOptions) {
  const interactive = stdin.isTTY && !flags.yes
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null
  async function choose(key, question, choices, fallback) {
    if (flags[key] !== undefined) {
      if (!choices.includes(flags[key])) fail(`--${key} must be one of: ${choices.join(", ")}`)
      return flags[key]
    }
    if (!rl) return fallback
    for (;;) {
      // An empty fallback lets Enter skip the question (the look's settings keep their defaults).
      const answer = (await rl.question(`${question} (${choices.map((c) => (c === fallback ? `${c}*` : c)).join(" / ")}) `)).trim() || fallback
      if (answer === "" || choices.includes(answer)) return answer
      console.log(`  Pick one of: ${choices.join(", ")}`)
    }
  }
  async function text(key, question, fallback) {
    if (typeof flags[key] === "string") return flags[key].trim() || fallback
    if (!rl) return fallback
    return (await rl.question(`${question} (${fallback}) `)).trim() || fallback
  }

  async function apps() {
    const names = Object.keys(proApps)
    const parse = (value) => {
      const list = value === "all" || value === "" ? names : value.split(",").map((name) => name.trim()).filter(Boolean)
      const unknown = list.filter((name) => !names.includes(name))
      return unknown.length ? { unknown } : { list: names.filter((name) => list.includes(name)) }
    }
    // A replay (`update`): every app but the ones this project removed, so apps a release adds are kept.
    if (typeof flags.removed === "string") return names.filter((name) => !flags.removed.split(",").includes(name))
    if (typeof flags.apps === "string") {
      const { list, unknown } = parse(flags.apps)
      if (unknown) fail(`--apps: unknown ${unknown.join(", ")}. Pick from: ${names.join(", ")} (or all)`)
      return list
    }
    if (!rl) return names
    for (;;) {
      const { list, unknown } = parse((await rl.question(`Apps to keep, comma-separated (${names.join(", ")}; Enter keeps all) `)).trim())
      if (!unknown) return list
      console.log(`  Unknown: ${unknown.join(", ")}`)
    }
  }

  if (pro && (flags.template !== undefined || flags.pages !== undefined)) {
    fail("In Dashral Pro, use --samples keep|remove instead of --template and --pages (Inset is one of the sample pages).")
  }
  const samples = pro ? await choose("samples", "Sample pages: Overview, Inset, Files, Pricing, error pages", ["keep", "remove"], "keep") : null
  const answers = {
    template: pro ? (samples === "keep" ? "both" : "classic") : await choose("template", "Template", ["classic", "inset", "both"], "classic"),
    pages: pro ? (samples === "keep" ? "demo" : "blank") : await choose("pages", "Pages", ["demo", "blank"], "demo"),
    ...(pro ? { apps: await apps() } : {}),
    languages: await choose("languages", "Languages", ["all", "en"], "all"),
    customizer: await choose("customizer", "Theme customizer in the header", ["keep", "remove"], "keep"),
    name: await text("name", "App name", "Dashral"),
    theme: {},
  }
  const themeGiven = themeKeys.some((key) => flags[key] !== undefined)
  const pickTheme = themeGiven || (rl && (await choose("look", "Pick colors, card style, radius and font now", ["no", "yes"], "no")) === "yes")
  if (pickTheme) {
    if (rl) console.log("  Enter keeps the template's default, marked *.")
    const defaults = readThemeDefaults(answers.template)
    // With the look given as flags (the customizer's command), the settings not in it keep their defaults.
    for (const key of themeKeys) {
      if (flags[key] !== undefined || (rl && !themeGiven)) {
        const value = await choose(key, `  ${key}`, themeOptions[key], defaults[key] ?? "")
        if (value && value !== defaults[key]) answers.theme[key] = value
      }
    }
  }
  rl?.close()
  return answers
}

// ── Steps ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Keeps or drops each `@dashral-if <feature>` … `@dashral-end` block, and removes the marker lines themselves. */
function applyMarkers(features) {
  for (const path of codeFiles("app", "components", "lib", "i18n", "scripts")) {
    const text = read(path)
    if (!text.includes("@dashral-")) continue
    const out = []
    // One entry per open block: whether it's kept. A line stays only when every block around it is kept.
    const open = []
    for (const line of text.split("\n")) {
      const start = /@dashral-if (!?)([\w-]+)/.exec(line)
      if (start) {
        if (!(start[2] in features)) fail(`Unknown feature "${start[2]}" in ${relative(root, path)}`)
        open.push(start[1] ? !features[start[2]] : features[start[2]])
        continue
      }
      if (/@dashral-end/.test(line)) {
        if (!open.length) fail(`An @dashral-end without its @dashral-if in ${relative(root, path)}`)
        open.pop()
        continue
      }
      if (open.every(Boolean)) out.push(line)
    }
    if (open.length) fail(`An @dashral-if without its @dashral-end in ${relative(root, path)}`)
    write(path, out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, ""))
  }
}

/** One template: drop the other one's pages, or move Inset to the root when it's the only one. */
// The other template's entry in lib/templates.ts goes with its markers.
function keepTemplate(template) {
  if (template === "classic") {
    remove(join(app, "app/inset"))
    remove(join(app, "app/layout-inset.css"))
    return
  }
  // Inset only: its frame becomes the dashboard's, and its pages move from /inset to the root. Settings and Pricing
  // are Classic's pages in Inset's frame already (app/inset re-exports them), so they simply stay.
  const dashboard = join(app, "app/(dashboard)")
  const inset = join(app, "app/inset")
  write(join(dashboard, "layout.tsx"), read(join(inset, "layout.tsx")))
  for (const page of ["page.tsx", "pro", ...classicPages]) remove(join(dashboard, page))
  for (const path of classicFramed) remove(join(app, path))
  for (const entry of readdirSync(inset)) {
    if (["layout.tsx", "template.tsx", "loading.tsx", "settings", "pricing"].includes(entry)) continue
    // A Classic page with the same name goes: Inset's is the one kept.
    remove(join(dashboard, entry))
    renameSync(join(inset, entry), join(dashboard, entry))
  }
  remove(inset)
  // Links: "/inset" is now "/", and "/inset/customers" is "/customers" (Inset's home in lib/templates.ts too).
  for (const path of codeFiles("app", "components", "lib").filter((path) => /\.tsx?$/.test(path))) {
    const text = read(path)
    const next = text.replace(/(["'`])\/inset\//g, "$1/").replace(/(["'`])\/inset(["'`?#])/g, "$1/$2")
    if (next !== text) write(path, next)
  }
}

function blankPage(file) {
  return `import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LayoutDashboard } from "lucide-react"
import { Card } from "@dashral/ui/components/card"
import { EmptyState } from "@dashral/ui/components/empty-state"

import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("overview"))("title") }
}

// Your dashboard's first page: replace the empty state with your own cards, charts and tables.
export default async function OverviewPage() {
  const t = await getTranslations("overview")
  return (
    <>
      <PageHeader title={t("title")} description={t("starter.description")} />
      <Card>
        <EmptyState
          icon={<LayoutDashboard />}
          title={t("starter.emptyTitle")}
          description={t("starter.emptyDescription", { path: ${JSON.stringify(file)} })}
          className="py-16"
        />
      </Card>
    </>
  )
}
`
}

/** Blank pages: each template keeps its home (now empty) and Settings; the demo pages and their menu go. */
function blankPages(template) {
  const dashboard = join(app, "app/(dashboard)")
  const kept = ["layout.tsx", "template.tsx", "loading.tsx", "page.tsx", "settings"]
  for (const entry of readdirSync(dashboard)) if (!kept.includes(entry)) remove(join(dashboard, entry))
  for (const path of classicFramed) remove(join(app, path))
  remove(join(app, "app/errors"))
  write(join(dashboard, "page.tsx"), blankPage("app/(dashboard)/page.tsx"))
  if (template === "both") {
    const inset = join(app, "app/inset")
    for (const entry of readdirSync(inset)) if (!kept.includes(entry)) remove(join(inset, entry))
    write(join(inset, "page.tsx"), blankPage("app/inset/page.tsx"))
  }
  // The menu: the home page and Settings, per template.
  const nav = join(app, "lib/nav.ts")
  const source = read(nav)
  const head = source.slice(0, source.indexOf("// @dashral-if classic"))
  const homes = template === "both" ? { classic: "/", inset: "/inset" } : { [template]: "/" }
  const menu = (home) => `[
    {
      label: "workspace",
      items: [
        { title: "overview", href: "${home}", icon: LayoutDashboard },
        { title: "settings", href: "${home === "/" ? "" : home}/settings", icon: Settings },
      ],
    },
  ]`
  write(
    nav,
    `${head}export const templateNavGroups: Record<Template, NavGroup[]> = {\n${Object.entries(homes)
      .map(([name, home]) => `  ${name}: ${menu(home)},`)
      .join("\n")}\n}\n`
  )
}

function keepEnglishOnly() {
  for (const locale of ["id", "ar"]) remove(join(app, "messages", locale))
}

/** The look your app starts with: the template's defaults with your picks over them, for every template kept. */
function writeTheme(template, theme) {
  if (Object.keys(theme).length === 0) return
  const path = join(app, "lib/theme-settings.ts")
  const source = read(path)
  const block = /export const defaultThemeSettings: ThemeSettings = \{[\s\S]*?\n\}/.exec(source)?.[0]
  if (!block) fail("Couldn't find defaultThemeSettings in lib/theme-settings.ts")
  // The kept template's own defaults (Inset's black and Geist) are the starting point.
  let next = block
  for (const [key, value] of Object.entries({ ...readThemeDefaults(template), ...theme })) next = next.replace(new RegExp(`(\\n  ${key}: )"[^"]*"`), `$1"${value}"`)
  write(path, source.replace(block, next))
  // Your look is every kept template's: their own picks (Inset's black and Geist) are folded in above, so they go.
  const templates = join(app, "lib/templates.ts")
  write(templates, read(templates).replace(/, theme: \{[^}]*\}/g, ""))
}

/** The Pro upgrade pages and their menu items: they sell Dashral, so they don't belong in your app. */
function removeUpgradePages() {
  remove(join(app, "app/(dashboard)/pro"))
  const nav = join(app, "lib/nav.ts")
  const text = read(nav)
  const next = text
    .split("\n")
    .filter((line) => !/\bpro: true\b/.test(line))
    .join("\n")
  if (next !== text) write(nav, next)
}

/**
 * demo.dashral.com's sign-in: a cookie and no accounts (lib/demo-sign-in.ts), off unless NEXT_PUBLIC_DEMO_SIGN_IN is
 * set. A project of your own keeps the sign-in pages and connects them in lib/sign-in.ts, so the routes, the gate in
 * proxy.ts, the setting and the demo's line on the sign-in page go (the code that used them goes with its markers).
 */
function removeHostedDemo() {
  remove(join(app, "app/api/demo"))
  remove(join(app, "lib/demo-sign-in.ts"))
  remove(join(app, "proxy.ts"))
  removeEmptyDirs(join(app, "app/api"))
  const env = join(app, ".env.example")
  if (existsSync(env)) {
    const text = read(env)
    const next = text.replace(/\n(?:#[^\n]*\n)*NEXT_PUBLIC_DEMO_SIGN_IN=[^\n]*\n?/, "\n")
    if (next !== text) writeFileSync(env, next)
  }
  for (const locale of readdirSync(join(app, "messages"))) {
    const file = join(app, "messages", locale, "auth.json")
    if (!existsSync(file)) continue
    const messages = JSON.parse(read(file))
    if (messages.login?.demo === undefined) continue
    delete messages.login.demo
    writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`)
  }
}

function writeName(name) {
  const site = join(app, "lib/site.ts")
  patch(site, 'const name = "Dashral"', `const name = ${JSON.stringify(name)}`)
  // Off by default now: the app names only your brand (NEXT_PUBLIC_DASHRAL_LINKS=true turns the links back on).
  // (Already so in Pro.)
  if (read(site).includes('!== "false",')) patch(site, 'show: process.env.NEXT_PUBLIC_DASHRAL_LINKS !== "false",', 'show: process.env.NEXT_PUBLIC_DASHRAL_LINKS === "true",')
}

/** Pro without its sample pages: Classic only, and "/" opens the app's own home (lib/edition.ts → appHome). */
function removeProSamples() {
  keepTemplate("classic")
  const dashboard = join(app, "app/(dashboard)")
  for (const page of [...classicPages, "pricing"]) remove(join(dashboard, page))
  for (const path of classicFramed) remove(join(app, path))
  remove(join(app, "app/errors"))
  write(
    join(dashboard, "page.tsx"),
    `import { redirect } from "next/navigation"

import { appHome } from "@/lib/edition"

// The app opens on a dashboard of its own: lib/edition.ts → appHome.
export default function Home() {
  redirect(appHome)
}
`
  )
}

/** Pro's apps that aren't kept: their folders, translations and menu go, and the database starts from what's left. */
function removeApps(removed) {
  for (const name of removed) {
    for (const path of [`app/(dashboard)/${name}`, `app/api/${name}`, `components/${name}`, `lib/${name}`, `lib/actions/${name}.ts`, `lib/db/${name}-schema.ts`])
      remove(join(app, path))
    if (name === "analytics") for (const path of ["lib/actions/analytics-sites.ts", "public/analytics.js"]) remove(join(app, path))
    for (const locale of readdirSync(join(app, "messages"))) {
      remove(join(app, "messages", locale, `${name}.json`))
      const index = join(app, "messages", locale, "index.ts")
      if (!existsSync(index)) continue
      const lines = read(index)
        .split("\n")
        .filter((line) => line !== `import ${name} from "./${name}.json"`)
        .map((line) => (/^(const \w+ = |export default )\{/.test(line) ? line.replace(new RegExp(`([{,] )${name}, `), "$1").replace(new RegExp(`, ${name}( \\})`), "$1") : line))
      write(index, lines.join("\n"))
    }
  }
}

/** Where the app opens: Analytics, or the first app kept when it isn't, or Settings with none. */
function writeAppHome(kept) {
  const home = kept.includes("analytics") ? proApps.analytics : kept.length ? proApps[kept[0]] : "/settings"
  patch(join(app, "lib/edition.ts"), /export const appHome = "[^"]*"/, `export const appHome = "${home}"`)
}

/** The migrations again, from the schema that's left: one migration for a database that starts fresh. */
function regenerateMigrations() {
  if (!existsSync(join(app, "node_modules/.bin/drizzle-kit"))) fail("Run `pnpm install` first: the database migrations are rebuilt with drizzle-kit.")
  remove(join(app, "drizzle"))
  try {
    execSync("node_modules/.bin/drizzle-kit generate --name init", { cwd: app, stdio: ["ignore", "pipe", "pipe"] })
  } catch (error) {
    fail(`drizzle-kit couldn't write the migrations:\n${String(error.stdout ?? "")}${String(error.stderr ?? "")}`)
  }
  // The local database was made by the old migrations: start it afresh (it fills itself again on `pnpm dev`).
  remove(join(app, ".data"))
}

// ── Updates ──────────────────────────────────────────────────────────────────────────────────────────────────────
//
// `pnpm dashral update` merges the latest release into a project `init` set up, then does what init would have done
// to it: what you removed stays removed (and what the release adds there goes too), and the database migrations of the
// release fit your database. In two steps, because the second runs with the release's own copy of this script:
//   1. fetch and merge the release; conflicts on files you removed resolve as removed
//   2. (`--continue`, run by step 1, or by you after fixing the conflicts left) re-apply init's choices, fit the
//      migrations, and check that the schema and the migrations agree

const git = (args, options = {}) => execSync(`git ${args}`, { cwd: root, stdio: ["ignore", "pipe", "pipe"], ...options }).toString()
const tryGit = (args) => {
  try {
    return git(args)
  } catch {
    return null
  }
}
const readRecord = () => JSON.parse(read(record))
const removedAppsOf = (answers) => answers.removed ?? (answers.apps ? Object.keys(proApps).filter((name) => !answers.apps.includes(name)) : [])
const conflicts = () => git("diff --name-only --diff-filter=U").split("\n").filter(Boolean)
const merging = () => tryGit("rev-parse -q --verify MERGE_HEAD") !== null

/** The command line that redoes this project's setup, from what init saved. */
function setupFlags(answers) {
  const flags = ["--replay", "--yes", "--force", "--languages", answers.languages, "--customizer", answers.customizer, "--name", answers.name]
  if (answers.apps) flags.push("--samples", answers.pages === "blank" ? "remove" : "keep", "--removed", removedAppsOf(answers).join(",") || "none")
  else flags.push("--template", answers.template, "--pages", answers.pages)
  for (const [key, value] of Object.entries(answers.theme ?? {})) flags.push(`--${key}`, value)
  return flags.map((flag) => JSON.stringify(String(flag))).join(" ")
}

/**
 * The setup redone, with the release's copy of this script, on the release this project has (`base`) and on the new
 * one: the two trees to merge the difference of. Null when it can't be (the release changed too much for it).
 */
function replaySetup(answers, base, release) {
  const dir = join(root, ".dashral-update")
  const trees = {}
  remove(dir)
  tryGit("worktree prune")
  try {
    // The release first: its script redoes both.
    for (const [key, rev] of [["release", release], ["base", base]]) {
      const path = join(dir, key)
      git(`worktree add --detach ${JSON.stringify(path)} ${rev}`)
      execSync(`node ${JSON.stringify(join(dir, "release/scripts/dashral.mjs"))} init ${setupFlags(answers)}`, {
        cwd: path,
        env: { ...process.env, DASHRAL_ROOT: path },
        stdio: ["ignore", "pipe", "pipe"],
      })
      git(`-C ${JSON.stringify(path)} add -A`)
      trees[key] = git(`-C ${JSON.stringify(path)} write-tree`).trim()
    }
    return trees
  } catch {
    return null
  } finally {
    for (const key of ["release", "base"]) tryGit(`worktree remove --force ${JSON.stringify(join(dir, key))}`)
    remove(dir)
    tryGit("worktree prune")
  }
}

/**
 * The files both sides changed, merged line by line. Where the two changed the same lines, both versions stay in the
 * file between conflict markers labelled "your project" and "the release", for you to pick from.
 */
function mergeChangedFiles() {
  const stages = {}
  for (const line of git("ls-files -u -z").split("\0").filter(Boolean)) {
    const [info, path] = line.split("\t")
    const [, blob, stage] = info.split(" ")
    ;(stages[path] ??= {})[stage] = blob
  }
  const dir = join(root, ".git", "dashral-merge")
  mkdirSync(dir, { recursive: true })
  for (const [path, blobs] of Object.entries(stages)) {
    // The cases with nothing to merge: deleted on one side and unchanged on the other is deleted (an old migration init
    // replaced, a file the release drops); added the same on both sides is added.
    if (blobs[1] && ((!blobs[2] && blobs[3] === blobs[1]) || (!blobs[3] && blobs[2] === blobs[1]))) {
      git(`rm -q --cached -- ${JSON.stringify(path)}`)
      remove(join(root, path))
      continue
    }
    if (!blobs[1] && blobs[2] && blobs[2] === blobs[3]) {
      git(`checkout --ours -- ${JSON.stringify(path)}`)
      git(`add -- ${JSON.stringify(path)}`)
      continue
    }
    // Deleted on one side and changed on the other, or added differently on both: for step 1's rules, or for you.
    if (!blobs[1] || !blobs[2] || !blobs[3]) continue
    const contents = ["2", "1", "3"].map((stage) => execSync(`git cat-file blob ${blobs[stage]}`, { cwd: root }))
    // A binary file (an image, say) can't be merged by line: it's left for you to pick.
    if (contents.some((content) => content.includes(0))) continue
    const files = contents.map((content, i) => {
      const file = join(dir, String(i))
      writeFileSync(file, content)
      return file
    })
    let clean = true
    let merged
    try {
      merged = execSync(`git merge-file -p -L "your project" -L "before" -L "the release" ${files.map((file) => JSON.stringify(file)).join(" ")}`, { cwd: root })
    } catch (error) {
      // Exit code: how many conflicts; the output is the file with them marked.
      if (typeof error.status !== "number" || error.status < 1 || !error.stdout) throw error
      merged = error.stdout
      clean = false
    }
    writeFileSync(join(root, path), merged)
    if (clean) git(`add -- ${JSON.stringify(path)}`)
  }
  remove(dir)
}

/** Files still holding conflict markers, among those the update changes. */
function filesWithMarkers() {
  // Not the migrations: the update rewrites their journal and snapshots itself.
  const changed = git("diff --cached --name-only HEAD")
    .split("\n")
    .filter((path) => path && !path.startsWith("apps/demo/drizzle/"))
  return changed.filter((path) => {
    const full = join(root, path)
    if (!existsSync(full) || statSync(full).size > 2_000_000) return false
    return /^(<{7} |>{7} )/m.test(read(full))
  })
}

// The repository's version tags, fetched apart from this project's own tags so the two never clash.
const releasesRef = "refs/dashral-releases"
const versionOf = (tag) => tag.slice(1).split(".").map(Number)
const byVersion = (a, b) => versionOf(a).reduce((order, part, i) => order || part - versionOf(b)[i], 0)

/** What to bring in: the newest release, the one --release names, or the tip of --branch. */
function releaseTarget(flags, remote) {
  if (typeof flags.branch === "string") {
    const ref = `refs/remotes/${remote}/${flags.branch}`
    if (tryGit(`rev-parse -q --verify ${ref}`) === null) fail(`The repository has no branch "${flags.branch}".`)
    return { ref, name: `${flags.branch} (not released yet)` }
  }
  const versions = git(`for-each-ref "--format=%(refname:strip=2)" ${releasesRef}`)
    .split("\n")
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
    .sort(byVersion)
  if (typeof flags.release === "string") {
    const tag = flags.release.startsWith("v") ? flags.release : `v${flags.release}`
    if (!versions.includes(tag)) fail(`There's no release ${tag}. The releases: ${versions.join(", ") || "none yet"}.`)
    return { ref: `${releasesRef}/${tag}`, name: tag }
  }
  if (!versions.length) {
    console.log("  It has no releases yet, so its main branch is brought in.")
    return { ref: `refs/remotes/${remote}/main`, name: "main" }
  }
  const newest = versions.at(-1)
  return { ref: `${releasesRef}/${newest}`, name: newest }
}

/** Step 1: the release, fetched and merged, with the conflicts on files this project removed resolved as removed. */
function startUpdate(flags) {
  if (!existsSync(record)) fail("This project wasn't set up with `pnpm dashral init`: update it with git (fetch and merge) instead.")
  if (merging()) fail("A merge is in progress. Fix its conflicts and run `pnpm dashral update --continue`, or `git merge --abort` to start over.")
  if (git("status --porcelain").trim()) fail("There are uncommitted changes. Commit them first, so the update is a change of its own.")
  const answers = readRecord()
  const url = typeof flags.from === "string" ? flags.from : answers.upstream
  if (!url) fail("Where should updates come from? Pass the repository's URL once: pnpm dashral update --from <url>")
  const remote = "dashral-upstream"
  if (tryGit(`remote get-url ${remote}`) === null) git(`remote add ${remote} ${JSON.stringify(url)}`)
  else git(`remote set-url ${remote} ${JSON.stringify(url)}`)
  console.log(`Fetching the releases from ${url}…`)
  try {
    const refspecs = [`+refs/heads/*:refs/remotes/${remote}/*`, `+refs/tags/v*:${releasesRef}/v*`]
    git(`fetch --no-tags --prune ${remote} ${refspecs.map((spec) => JSON.stringify(spec)).join(" ")}`, { stdio: ["ignore", "pipe", "inherit"] })
  } catch {
    fail("Couldn't fetch it. Check that this computer can reach the repository (for Pro: your GitHub account has access).")
  }
  const target = releaseTarget(flags, remote)
  const release = git(`rev-parse ${target.ref}^{commit}`).trim()
  if (tryGit(`merge-base --is-ancestor ${release} HEAD`) !== null) {
    console.log(`\n✔ Already up to date: your project has ${target.name}.`)
    return
  }
  console.log(`Bringing in ${target.name}…`)
  const replayed = replaySetup(answers, git(`merge-base HEAD ${release}`).trim(), release)
  if (replayed) {
    // The release's changes as they'd look in your project: the setup redone on the release you have and on the new
    // one, and the difference between the two merged into yours. Recorded as a merge of the release, so the next
    // update starts from it.
    git(`merge -s ours --no-ff --no-commit -m ${JSON.stringify(`Update to Dashral ${target.name}`)} ${release}`)
    git(`read-tree -m -u ${replayed.base} HEAD ${replayed.release}`)
    mergeChangedFiles()
  } else {
    console.log("  Couldn't redo your setup on the release, so it's merged as it is: expect more conflicts.")
    try {
      git(`merge --no-ff --no-commit -m ${JSON.stringify(`Update to Dashral ${target.name}`)} ${release}`)
    } catch {
      // As above.
    }
  }
  // A file this project deleted (an app, a template, the sample pages) that the release changed: it stays deleted.
  const status = git("status --porcelain").split("\n")
  const kept = []
  for (const line of status) {
    const [code, path] = [line.slice(0, 2), line.slice(3)]
    if (code === "DU") {
      git(`rm -q -- ${JSON.stringify(path)}`)
      kept.push(path)
    }
  }
  if (kept.length) console.log(`  ${kept.length === 1 ? "1 file you removed stays" : `${kept.length} files you removed stay`} removed (the release changed ${kept.length === 1 ? "it" : "them"}).`)
  // The rest runs with the release's copy of this script.
  try {
    execSync(`node ${JSON.stringify(join(root, "scripts/dashral.mjs"))} update --continue`, { cwd: root, stdio: "inherit" })
  } catch (error) {
    // Step 2 said why it stopped (conflicts to fix, say).
    exit(error.status ?? 1)
  }
}

/** The tables and enums the removed apps own, from their schema files in the release (or before it). */
function removedNames(removedApps) {
  const names = new Set()
  for (const name of removedApps) {
    for (const rev of ["MERGE_HEAD", "HEAD", "ORIG_HEAD"]) {
      const text = tryGit(`show ${rev}:apps/demo/lib/db/${name}-schema.ts`)
      if (!text) continue
      for (const match of text.matchAll(/pg(?:Table|Enum)\(\s*"([^"]+)"/g)) names.add(match[1])
    }
  }
  return names
}

/**
 * The release's new migrations, made to fit this project: in the journal after the ones you have (with a later time,
 * or the migrator would skip them as already applied), without the statements about the apps you removed, and with
 * the latest snapshot rewritten from your schema so your next `pnpm db:generate` only writes your own changes.
 */
function fitMigrations(removedApps) {
  const journalPath = "apps/demo/drizzle/meta/_journal.json"
  const at = (rev) => {
    const text = tryGit(`show ${rev}:${journalPath}`)
    return text ? JSON.parse(text) : null
  }
  const ours = at("HEAD")
  const theirs = at("MERGE_HEAD")
  if (!ours || !theirs) return []
  const base = at(git("merge-base HEAD MERGE_HEAD").trim()) ?? { entries: [] }
  const known = new Set([...ours.entries, ...base.entries].map((entry) => entry.tag))
  const added = theirs.entries.filter((entry) => !known.has(entry.tag))
  if (!added.length) {
    // Nothing new from the release: the journal and the snapshots stay yours.
    for (const path of conflicts().filter((path) => path.startsWith("apps/demo/drizzle/"))) git(`checkout --ours -- ${JSON.stringify(path)}`)
    write(join(root, journalPath), `${JSON.stringify(ours, null, 2)}\n`)
    return []
  }
  // Statements about the removed apps' tables go; a migration left with nothing says so.
  const names = removedNames(removedApps)
  const mentions = (statement) => [...names].some((name) => statement.includes(`"${name}"`))
  for (const entry of added) {
    const path = join(app, "drizzle", `${entry.tag}.sql`)
    if (!existsSync(path)) fail(`The release's migration ${entry.tag}.sql is missing from apps/demo/drizzle.`)
    const statements = read(path).split("--> statement-breakpoint")
    const keep = statements.filter((statement) => !mentions(statement))
    if (keep.length !== statements.length)
      write(path, keep.length && keep.join("").trim() ? keep.join("--> statement-breakpoint") : "-- This release's change was for apps this project removed: nothing to do here.\n")
  }
  // Numbers: drizzle-kit names a migration and its snapshot by number, and yours count up from init's 0000. A release's
  // migration numbered at or below your highest moves above it (its snapshot would overwrite yours otherwise); the next
  // update still knows it by its old name, from the release before.
  const prefix = (tag) => Number(tag.split("_")[0])
  const snapshotOf = (number) => join(app, "drizzle/meta", `${String(number).padStart(4, "0")}_snapshot.json`)
  let highest = Math.max(...ours.entries.map((entry) => prefix(entry.tag)))
  const current = currentSnapshot()
  let prevId = JSON.parse(read(snapshotOf(prefix(ours.entries.at(-1).tag)))).id
  let when = Math.max(Date.now(), ...ours.entries.map((entry) => entry.when))
  const fitted = []
  for (const entry of added) {
    let tag = entry.tag
    if (prefix(tag) <= highest) {
      const clash = snapshotOf(prefix(tag))
      // Both sides added a snapshot with this number: keep yours where it is.
      if (conflicts().includes(relative(root, clash))) git(`checkout --ours -- ${JSON.stringify(relative(root, clash))}`)
      else if (!ours.entries.some((own) => prefix(own.tag) === prefix(tag))) remove(clash)
      tag = `${String(highest + 1).padStart(4, "0")}${tag.slice(tag.indexOf("_"))}`
      renameSync(join(app, "drizzle", `${entry.tag}.sql`), join(app, "drizzle", `${tag}.sql`))
    }
    highest = Math.max(highest, prefix(tag))
    // Its snapshot: the release's describes its own schema (every app), so it's rewritten from yours, chained after
    // the one before.
    const id = crypto.randomUUID()
    write(snapshotOf(prefix(tag)), `${JSON.stringify({ ...current, id, prevId }, null, 2)}\n`)
    prevId = id
    // A later time than every migration before it, or the migrator skips it as already applied.
    fitted.push({ ...entry, tag, idx: prefix(tag), when: ++when })
  }
  write(join(root, journalPath), `${JSON.stringify({ ...theirs, entries: [...ours.entries, ...fitted] }, null, 2)}\n`)
  return fitted.map((entry) => entry.tag)
}

/** The snapshot drizzle-kit makes of the schema as it is now, made in a folder of its own and thrown away. */
function currentSnapshot() {
  // Relative to apps/demo: drizzle-kit puts "./" before the folder it's given.
  const name = ".dashral-snapshot"
  const out = join(app, name)
  remove(out)
  try {
    execSync(`node_modules/.bin/drizzle-kit generate --dialect postgresql --schema ./lib/db/schema.ts --out ${name}`, { cwd: app, stdio: ["ignore", "pipe", "pipe"] })
    const file = readdirSync(join(out, "meta")).find((name) => name.endsWith("_snapshot.json"))
    return JSON.parse(read(join(out, "meta", file)))
  } catch (error) {
    fail(`drizzle-kit couldn't read the schema:\n${String(error.stdout ?? "")}${String(error.stderr ?? "")}`)
  } finally {
    remove(out)
  }
}

/** The migrations and the schema agree when drizzle-kit, run on a copy of them, finds nothing to write. */
function migrationsMatchSchema() {
  const name = ".dashral-check"
  const copy = join(app, name)
  remove(copy)
  execSync(`cp -R drizzle ${name}`, { cwd: app })
  try {
    const output = execSync(`node_modules/.bin/drizzle-kit generate --dialect postgresql --schema ./lib/db/schema.ts --out ${name}`, {
      cwd: app,
      stdio: ["ignore", "pipe", "pipe"],
    }).toString()
    return /No schema changes/.test(output)
  } finally {
    remove(copy)
  }
}

/** Step 2: init's choices again on what the release brought, then the migrations. */
function continueUpdate() {
  if (!merging()) fail("No update in progress. Start one with `pnpm dashral update`.")
  const left = conflicts().filter((path) => !path.startsWith("apps/demo/drizzle/"))
  if (left.length) {
    console.log(`\nThe release and your changes meet in ${left.length} file${left.length === 1 ? "" : "s"}; keep what you want in each:\n${left.map((path) => `  ${path}`).join("\n")}`)
    console.log("\nThen: git add <file> for each, and pnpm dashral update --continue")
    exit(1)
  }
  git("add -u")
  const marked = filesWithMarkers()
  if (marked.length) {
    console.log(`\nThese files still have conflict markers (<<<<<<< your project … >>>>>>> the release); keep one side or both, and delete the markers:\n${marked.map((path) => `  ${path}`).join("\n")}`)
    console.log("\nThen: pnpm dashral update --continue")
    exit(1)
  }
  const answers = readRecord()
  const removedApps = removedAppsOf(answers)
  // What init removed, removed again: the release may have changed it or added to it.
  if (pro) {
    if (answers.pages === "blank") for (const path of ["app/inset", "app/layout-inset.css", ...[...classicPages, "pricing"].map((page) => `app/(dashboard)/${page}`), ...classicFramed, "app/errors"]) remove(join(app, path))
    removeApps(removedApps)
  } else {
    if (answers.template === "classic") for (const path of ["app/inset", "app/layout-inset.css"]) remove(join(app, path))
    if (answers.template === "inset" && existsSync(join(app, "app/inset")))
      console.log("  The release changed Inset pages under app/inset; your Inset pages are at the root. Copy over what you want, then delete app/inset.")
    // Inset only: Classic pages the release adds go. Only new ones: a folder of that name you already had is yours.
    if (answers.template === "inset")
      for (const path of [...classicPages.map((page) => `apps/demo/app/(dashboard)/${page}`), ...classicFramed.map((framed) => `apps/demo/${framed}`)]) {
        if (existsSync(join(root, path)) && !tryGit(`ls-tree -d HEAD -- ${JSON.stringify(path)}`)?.trim()) remove(join(root, path))
      }
    if (answers.pages === "blank") {
      const kept = ["layout.tsx", "template.tsx", "loading.tsx", "page.tsx", "settings"]
      for (const dir of ["app/(dashboard)", ...(answers.template === "both" ? ["app/inset"] : [])]) {
        const path = join(app, dir)
        if (existsSync(path)) for (const entry of readdirSync(path)) if (!kept.includes(entry)) remove(join(path, entry))
      }
      for (const path of classicFramed) remove(join(app, path))
      remove(join(app, "app/errors"))
    }
  }
  // Apps the release adds are yours to have: their markers stay.
  const keptApps = Object.keys(proApps).filter((name) => !removedApps.includes(name))
  applyMarkers({
    classic: answers.template !== "inset",
    inset: answers.template !== "classic",
    switcher: answers.template === "both",
    i18n: answers.languages === "all",
    customizer: answers.customizer === "keep",
    demo: answers.pages === "demo",
    ...Object.fromEntries(keptApps.map((name) => [`app-${name}`, true])),
    ...Object.fromEntries(removedApps.map((name) => [`app-${name}`, false])),
  })
  removeUpgradePages()
  if (answers.languages === "en") keepEnglishOnly()
  for (const path of touched) pruneImports(path)

  let migrations = []
  if (pro && existsSync(join(app, "drizzle"))) {
    if (!existsSync(join(app, "node_modules/.bin/drizzle-kit"))) fail("Run `pnpm install` first: the update's migrations are checked with drizzle-kit. Then: pnpm dashral update --continue")
    migrations = fitMigrations(removedApps)
    try {
      JSON.parse(read(join(app, "drizzle/meta/_journal.json")))
    } catch {
      fail("apps/demo/drizzle/meta/_journal.json isn't valid JSON after the update. `git merge --abort` and tell us: this is a bug.")
    }
    if (!migrationsMatchSchema())
      fail("The migrations and the schema don't agree after the update. Your own schema changes may need their migration: run `pnpm db:generate`, then `pnpm dashral update --continue`.")
  }
  git("add -A")
  // Apps the release adds (Pro): kept, and written down so the next update knows them.
  const newApps = pro && answers.apps ? Object.keys(proApps).filter((name) => !answers.apps.includes(name) && !removedApps.includes(name)) : []
  if (newApps.length) writeFileSync(record, `${JSON.stringify({ ...answers, apps: [...answers.apps, ...newApps] }, null, 2)}\n`)
  git("add -A")
  console.log(`
✔ The release is merged, and staged for your review.${migrations.length ? `\n  ${migrations.length} new migration${migrations.length === 1 ? "" : "s"}: ${migrations.join(", ")} (fitted to your apps). Apply with pnpm db:migrate, or on your next deploy.` : ""}${newApps.length ? `\n  New apps: ${newApps.join(", ")}.` : ""}

Next:
  git diff --cached --stat   what the update changes
  pnpm install && pnpm typecheck
  git commit                 to finish the update (git merge --abort undoes it)`)
}

// ── Clean-up ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Removes named imports a file no longer uses, and imports left with nothing in them. */
function pruneImports(path) {
  if (!/\.tsx?$/.test(path) || !existsSync(path)) return
  const text = read(path)
  const pattern = /^import\s+(type\s+)?([^"'`;]+?)\s+from\s+(["'][^"']+["']);?[ \t]*$/gm
  let next = text
  for (const match of text.matchAll(pattern)) {
    const [statement, typeOnly = "", clause, from] = match
    // The rest of the file without its comments, so a name only mentioned in one doesn't count.
    const rest = next
      .replace(statement, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'`])\/\/.*$/gm, "$1")
    // Not after a dot (obj.name is someone else's), except a spread's three (...name is a use).
    const used = (name) => new RegExp(`(?<![\\w$])(?:(?<=\\.\\.\\.)|(?<!\\.))${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(rest)
    let defaultName = null
    let named = []
    let namespace = null
    const braces = /\{([\s\S]*)\}/.exec(clause)
    const outside = clause.replace(/\{[\s\S]*\}/, "").replace(/,/g, " ").trim()
    if (outside.startsWith("* as ")) namespace = outside.slice(5).trim()
    else if (outside) defaultName = outside
    if (braces) named = braces[1].split(",").map((item) => item.trim()).filter(Boolean)
    const keptNamed = named.filter((item) => used(item.replace(/^type\s+/, "").split(/\s+as\s+/).pop()))
    const keepDefault = defaultName && used(defaultName)
    const keepNamespace = namespace && used(namespace)
    if (keptNamed.length === named.length && (!defaultName || keepDefault) && (!namespace || keepNamespace)) continue
    const parts = []
    if (keepDefault) parts.push(defaultName)
    if (keepNamespace) parts.push(`* as ${namespace}`)
    if (keptNamed.length) parts.push(`{ ${keptNamed.join(", ")} }`)
    next = next.replace(statement, parts.length ? `import ${typeOnly}${parts.join(", ")} from ${from}` : "")
  }
  if (next !== text) write(path, next.replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n"))
}

/** Deletes components/ and lib/ files nothing imports any more (the other template's, the demo pages' data, …). */
function pruneUnreachable() {
  const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".css", "/index.ts", "/index.tsx"]
  const resolveImport = (from, spec) => {
    const base = spec.startsWith("@/") ? join(app, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null
    if (!base) return null
    for (const ext of extensions) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext
    return null
  }
  const roots = [
    ...codeFiles("app", "i18n", "scripts"),
    ...["global.d.ts", "next.config.ts", "proxy.ts", "middleware.ts", "instrumentation.ts", "drizzle.config.ts"].map((file) => join(app, file)).filter(existsSync),
  ]
  const seen = new Set()
  const queue = [...roots]
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    const text = read(file)
    for (const match of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+|@import\s+)["']([^"']+)["']/g)) {
      const target = resolveImport(file, match[1])
      if (target && !seen.has(target)) queue.push(target)
    }
  }
  const removed = []
  for (const file of codeFiles("components", "lib")) {
    if (!seen.has(file)) {
      rmSync(file)
      removed.push(relative(app, file))
    }
  }
  // Files in public/ no code names any more, such as the Pro pages' screenshots in public/screens.
  const code = [...seen].map(read).join("\n")
  for (const entry of existsSync(join(app, "public")) ? readdirSync(join(app, "public")) : []) {
    if (!code.includes(`/${entry}`)) {
      rmSync(join(app, "public", entry), { recursive: true })
      removed.push(`public/${entry}`)
    }
  }
  removeEmptyDirs(join(app, "components"))
  removeEmptyDirs(join(app, "lib"))
  removeEmptyDirs(join(app, "app"))
  return removed
}

// ── Flat layout ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Files of this repository that a project of its own doesn't need (it gets its own README). */
const repositoryOnly = [
  "packages",
  "scripts",
  "turbo.json",
  ".turbo",
  ".github",
  "AGENTS.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "README.md",
  "node_modules",
]
/** Files in apps/demo that stay behind: what the move replaces or what's made again. */
const appLeftBehind = ["node_modules", ".next", ".turbo", "tsconfig.tsbuildinfo", "package.json", "tsconfig.json", ".gitignore"]

/**
 * `--layout flat`: apps/demo becomes the project, like a new Next.js app. Its files move to the root, the kit's
 * workspace packages become npm dependencies at this release's versions (@dashral/ui stays imported as it was), the
 * shared TypeScript settings are written into tsconfig.json, and the monorepo's files go: packages, turbo, the
 * workspace list, this script and the repository's docs.
 */
function flatten() {
  const json = (path) => JSON.parse(read(path))
  const rootPkg = json(join(root, "package.json"))
  const appPkg = json(join(app, "package.json"))

  // package.json: the app's, named after the folder, with the kit from npm.
  const kitVersion = (dep) => json(join(root, "packages", dep.slice("@dashral/".length), "package.json")).version
  for (const field of ["dependencies", "devDependencies"]) {
    for (const [dep, version] of Object.entries(appPkg[field] ?? {})) {
      if (!String(version).startsWith("workspace:")) continue
      if (dep === "@dashral/typescript-config") delete appPkg[field][dep]
      else appPkg[field][dep] = `^${kitVersion(dep)}`
    }
  }
  const folder = root.split(/[\\/]/).at(-1)
  const slug = folder.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-._]+|[-._]+$/g, "") || "my-app"
  const { name: _name, version: _version, license: _license, private: _private, ...rest } = appPkg
  const pkg = { name: slug, version: "0.1.0", private: true, ...rest, packageManager: rootPkg.packageManager, engines: rootPkg.engines }
  for (const key of ["clean"]) delete pkg.scripts?.[key]

  // tsconfig.json: the shared settings (packages/typescript-config) written in, then the app's own.
  const appTsconfig = json(join(app, "tsconfig.json"))
  const shared = (file) => json(join(root, "packages/typescript-config", file))
  const nextjs = shared(appTsconfig.extends.split("/").at(-1))
  const base = nextjs.extends ? shared(nextjs.extends.replace("./", "")) : { compilerOptions: {} }
  const { extends: _extends, ...appRest } = appTsconfig
  const tsconfig = {
    ...appRest,
    compilerOptions: { ...base.compilerOptions, ...nextjs.compilerOptions, ...appTsconfig.compilerOptions },
  }

  // .gitignore: the repository's, without what only the monorepo had, and the app's own lines.
  const appIgnore = existsSync(join(app, ".gitignore")) ? read(join(app, ".gitignore")) : ""
  const gitignore = `${read(join(root, ".gitignore"))
    .replace(/\n# turbo\n\.turbo\n/, "\n")
    .replace(/\n# internal planning docs[^\n]*\n[^\n]*\n?/, "\n")
    .trimEnd()}\n${appIgnore ? `\n${appIgnore.trimEnd()}\n` : ""}`

  for (const entry of repositoryOnly) remove(join(root, entry))
  for (const entry of readdirSync(app)) {
    if (appLeftBehind.includes(entry)) continue
    renameSync(join(app, entry), join(root, entry))
  }
  remove(join(root, "apps"))

  writeFileSync(join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`)
  writeFileSync(join(root, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`)
  writeFileSync(join(root, ".gitignore"), gitignore)
  // The workspace file keeps pnpm's settings (allowed builds, overrides) without its list of packages.
  const workspace = join(root, "pnpm-workspace.yaml")
  if (existsSync(workspace)) {
    const settings = read(workspace).replace(/^packages:\n(?:\s+-[^\n]*\n)+/m, "").trimStart()
    if (settings.trim()) writeFileSync(workspace, settings)
    else remove(workspace)
  }
  // The lockfile was the monorepo's: `pnpm install` writes the project's own.
  remove(join(root, "pnpm-lock.yaml"))
  // The kit is a package from npm now: Next.js needn't compile it.
  const nextConfig = join(root, "next.config.ts")
  if (existsSync(nextConfig)) writeFileSync(nextConfig, read(nextConfig).replace(/\n  transpilePackages: \[[^\]]*\],/, ""))

  writeFileSync(join(root, "README.md"), flatReadme(pkg))
}

/** The flat project's README: how to run it, where things are, how to update. */
function flatReadme(pkg) {
  const has = (path) => existsSync(join(root, path))
  return `# ${pkg.name}

A Next.js app started from [Dashral](https://dashral.com) with \`npx create-dashral\`.

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

| Command | |
| --- | --- |
${Object.keys(pkg.scripts ?? {})
  .map((script) => `| \`pnpm ${script}\` | \`${pkg.scripts[script]}\` |`)
  .join("\n")}

## Where things are

| What | Where |
| --- | --- |
| Pages | \`app/\` |
| The app's own components | \`components/\` |
| The menu | \`lib/nav.ts\` |
| Name, description and links | \`lib/site.ts\` |
${has("messages") ? "| Text in each language | `messages/<locale>/` |\n" : ""}| Theme presets | \`app/theme-presets.css\` |

The UI components come from [\`@dashral/ui\`](https://www.npmjs.com/package/@dashral/ui): \`import { Button } from
"@dashral/ui/components/button"\`. Their docs and examples are at [dashral.com/components](https://dashral.com/components).

## Updates

\`pnpm up @dashral/ui\` brings in new components and fixes. To change a component's own code, copy it into the app from
Dashral's registry (\`npx shadcn add https://dashral.com/r/button.json\`) and import it from there instead.

## Add sign-in

The sign-in, sign-up and two-factor pages (\`app/(auth)/\`) are designed and ready, without accounts behind them. Connect
them to the auth library you use:

1. \`lib/sign-in.ts\`: where the forms and the account menu's Sign out go, your sign-in route or server action.
2. \`lib/account.ts\`: the person the account menu shows; read it from your session.
3. Keep signed-out visitors out of the dashboard in a \`proxy.ts\` (Next.js's request middleware), as your library
   describes.

[Dashral Pro](https://dashral.com/pricing) comes with real sign-in: accounts, roles, two-factor and passkeys.

## Put it online

Deploy to Vercel or any Node host, and set your address in \`NEXT_PUBLIC_SITE_URL\`${has(".env.example") ? " (see `.env.example`)" : ""}.

Built on Dashral, MIT licensed (see \`LICENSE\`).
`
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

async function init(flags) {
  if (!existsSync(join(app, "lib/templates.ts"))) fail("Run this from a Dashral repository: apps/demo wasn't found.")
  const replay = Boolean(flags.replay)
  if (!replay && existsSync(record)) fail("This project was already set up (.dashral.json). Start again from a fresh clone to set it up differently.")
  const layout = flags.layout ?? "monorepo"
  if (!["monorepo", "flat"].includes(layout)) fail("--layout must be one of: monorepo, flat")
  if (layout === "flat" && pro) fail("Dashral Pro keeps the monorepo layout for now: leave out --layout flat.")
  if (!flags.force && existsSync(join(root, ".git"))) {
    const status = execSync("git status --porcelain", { cwd: root }).toString().trim()
    if (status) fail("There are uncommitted changes. Commit them first (or pass --force), so you can see and undo what this changes.")
  }

  const answers = await ask(flags, readThemeOptions())
  const { template, pages, languages, customizer, name, theme } = answers
  const kept = answers.apps ?? []
  const removedApps = pro ? Object.keys(proApps).filter((name) => !kept.includes(name)) : []
  const features = {
    classic: template !== "inset",
    inset: template !== "classic",
    switcher: template === "both",
    i18n: languages === "all",
    customizer: customizer === "keep",
    demo: pages === "demo",
    // demo.dashral.com's own sign-in (lib/demo-sign-in.ts): never in a project of your own.
    hosted: false,
    ...Object.fromEntries(Object.keys(proApps).map((name) => [`app-${name}`, kept.includes(name)])),
  }

  if (!replay) console.log("\nSetting up your dashboard…")
  if (pro) {
    if (pages === "blank") removeProSamples()
    removeApps(removedApps)
    writeAppHome(kept)
  } else {
    if (template !== "both") keepTemplate(template)
    if (pages === "blank") blankPages(template)
  }
  applyMarkers(features)
  removeUpgradePages()
  if (languages === "en") keepEnglishOnly()
  if (!pro) removeHostedDemo()
  writeTheme(template, theme)
  writeName(name)
  for (const path of touched) pruneImports(path)
  // A replay leaves the migrations as the release has them: `update` fits them to this project itself.
  if (removedApps.length && !replay) {
    console.log("Rebuilding the database migrations…")
    regenerateMigrations()
  }
  const removed = pruneUnreachable()
  // Next.js's build cache still knows the deleted pages (its generated route types fail the typecheck): start it afresh.
  remove(join(app, ".next"))
  if (replay) return
  if (layout === "flat") {
    flatten()
    console.log(`
✔ Done: ${template === "both" ? "Classic and Inset" : template === "classic" ? "Classic" : "Inset"}, ${pages === "blank" ? "a blank page" : "the demo pages"}, ${
      languages === "en" ? "English" : "three languages"
    }${customizer === "keep" ? ", the theme customizer" : ""}, named ${JSON.stringify(name)}, as a Next.js project of its own.${
      removed.length ? ` ${removed.length} files nothing used any more were removed.` : ""
    }

${process.env.DASHRAL_CREATE ? "" : "Next:\n  pnpm install      @dashral/ui and the rest, from npm\n  pnpm dev          your app at http://localhost:3000\n\n"}Update the components with \`pnpm up @dashral/ui\`. The rest of the setup (logo, domain, links) is in README.md.`)
    return
  }
  // Where this clone came from, for `pnpm dashral update` (before you point origin at your own repository).
  const upstream = existsSync(join(root, ".git")) ? tryGit("remote get-url origin")?.trim() || undefined : undefined
  writeFileSync(record, `${JSON.stringify({ ...answers, ...(pro ? { removed: removedApps } : {}), upstream, setUpAt: new Date().toISOString() }, null, 2)}\n`)

  const kind = pro
    ? `${kept.length === Object.keys(proApps).length ? "every app" : kept.length ? kept.join(", ") : "no apps"}, ${pages === "blank" ? "without" : "with"} the sample pages`
    : `${template === "both" ? "Classic and Inset" : template === "classic" ? "Classic" : "Inset"}, ${pages === "blank" ? "a blank page" : "the demo pages"}`
  console.log(`
✔ Done: ${kind}, ${
    languages === "en" ? "English" : "three languages"
  }${customizer === "keep" ? ", the theme customizer" : ""}, named ${JSON.stringify(name)}.${removed.length ? ` ${removed.length} files nothing used any more were removed.` : ""}

Next:
  pnpm dev          your app at http://localhost:3000
  pnpm typecheck    a quick check after your first changes
  git diff --stat   everything this changed, before you commit it

${removedApps.length ? "The database migrations were rebuilt for the apps you kept, and the local database starts afresh.\n" : ""}Your choices are in .dashral.json: keep it, \`pnpm dashral update\` reads it to bring in new releases. The rest of
the setup (logo, domain, links) is in README.md → Make it yours.`)
}

const { command, flags } = parseArgs(argv.slice(2))
if (command === "init") await init(flags)
else if (command === "update") flags.continue ? continueUpdate() : startUpdate(flags)
else console.log(help)
