#!/usr/bin/env node
// `npx create-dashral my-app`: a new dashboard from Dashral's newest release, in one command. It clones the repository
// at the release's tag (with its history, so `pnpm dashral update` can merge later releases), installs the
// dependencies, then runs the repository's own `pnpm dashral init` with every other flag you passed. Nothing about the
// setup lives here: the release's scripts/dashral.mjs does it, so this file rarely needs a new version.
//
//   npx create-dashral my-app
//   npx create-dashral my-app --template inset --pages blank --languages en --name "Acme" --primary indigo
//   npx create-dashral my-app --pro --apps crm,kanban --name "Acme"        (Dashral Pro: needs your GitHub access)

import { spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { argv, exit, platform, versions } from "node:process"

const repos = {
  free: "https://github.com/hasralgana/dashral.git",
  pro: "https://github.com/hasralgana/dashral-pro.git",
}

const help = `Usage: npx create-dashral <folder> [options]

  Starts a new dashboard in <folder> from Dashral's newest release: clones it, installs the dependencies and runs
  \`pnpm dashral init\`, which asks a few questions (or reads them from the flags below).

Options of create-dashral:
  --pro                Start from Dashral Pro (your GitHub account needs access to the repository)
  --release v1.2.0     An earlier release instead of the newest
  --from <url>         Clone another repository (a fork, or Pro over SSH: git@github.com:hasralgana/dashral-pro.git)
  --no-install         Clone and set up only; run \`pnpm install\` yourself

Every other option goes to \`pnpm dashral init\`:
  --template classic|inset|both  --pages demo|blank  --languages all|en  --customizer keep|remove
  --name "Your App"  --primary  --light  --dark  --card  --radius  --font  --yes
  Pro: --apps all|crm,kanban,…  --samples keep|remove

The theme customizer's "Copy setup command" at https://demo.dashral.com writes these flags for you.
Docs: https://dashral.com/docs/installation`

// ── Arguments ────────────────────────────────────────────────────────────────────────────────────────────────────

/** This script's own flags, and the rest passed to `dashral init` as they were typed. */
function parseArgs(args) {
  const own = { pro: false, install: true, release: null, from: null, help: false }
  const rest = []
  let folder = null
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const [key, inline] = arg.startsWith("--") ? arg.slice(2).split(/=(.*)/s) : [null]
    const value = () => (inline !== undefined ? inline : args[++i])
    if (arg === "-h" || key === "help") own.help = true
    else if (key === "pro") own.pro = true
    else if (key === "no-install") own.install = false
    else if (key === "release" || key === "from") {
      own[key] = value()
      if (!own[key] || own[key].startsWith("--")) fail(`--${key} needs a value.`)
    } else if (key === null && folder === null) folder = arg
    else rest.push(arg)
  }
  return { folder, own, rest }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function fail(message) {
  console.error(`\n✖ ${message}`)
  exit(1)
}

/** Runs a command in the terminal (its output and questions shown as they come); its exit code, or null. */
function run(command, args, cwd) {
  // Windows runs pnpm through a .cmd shim, which needs a shell.
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: platform === "win32" })
  return result.error ? null : result.status
}

/** A command's output, or null when it can't run. */
function output(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: platform === "win32" })
  return result.status === 0 ? result.stdout.trim() : null
}

const versionOf = (tag) => tag.slice(1).split(".").map(Number)
const newer = (a, b) => {
  const [x, y] = [versionOf(a), versionOf(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const { folder, own, rest } = parseArgs(argv.slice(2))
if (own.help || !folder) {
  console.log(help)
  exit(own.help ? 0 : 1)
}

if (Number(versions.node.split(".")[0]) < 20) fail(`Dashral needs Node.js 20 or newer (this is ${versions.node}).`)
if (output("git", ["--version"]) === null) fail("Git wasn't found. Install it from https://git-scm.com and run this again.")
if (own.install && output("pnpm", ["--version"]) === null) {
  fail("pnpm wasn't found. Turn it on with `corepack enable pnpm` (or `npm install -g pnpm`) and run this again.")
}

const target = resolve(folder)
if (existsSync(target) && readdirSync(target).length) fail(`${folder} isn't empty. Pick a new folder.`)

const url = own.from ?? (own.pro ? repos.pro : repos.free)
const access = own.pro ? " Check that your GitHub account has access to Dashral Pro (accept the invitation GitHub emailed you)." : ""

// The release: the newest version tag, or the one --release names.
console.log(`Looking for the releases of ${url}…`)
const listed = output("git", ["ls-remote", "--tags", "--refs", url, "v*"])
if (listed === null) fail(`Couldn't reach ${url}.${access}`)
const tags = listed
  .split("\n")
  .map((line) => line.split("refs/tags/")[1])
  .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag ?? ""))
  .sort(newer)
let release = tags.at(-1)
if (own.release) {
  release = own.release.startsWith("v") ? own.release : `v${own.release}`
  if (!tags.includes(release)) fail(`There's no release ${release}. The releases: ${tags.join(", ") || "none yet"}.`)
}
if (!release) fail(`${url} has no releases yet.`)

// The whole history, not a shallow copy: `pnpm dashral update` merges later releases into it.
console.log(`\nCloning Dashral ${release} into ${folder}…`)
if (run("git", ["clone", "--quiet", "--branch", release, url, target]) !== 0) fail(`Couldn't clone ${url}.${access}`)
// A tag checks out without a branch: start yours, so your commits have one.
if (run("git", ["switch", "--quiet", "-c", "main"], target) !== 0) fail("Couldn't start the main branch.")

if (own.install) {
  console.log("\nInstalling the dependencies…")
  if (run("pnpm", ["install"], target) !== 0) fail(`pnpm install stopped. Fix what it says, then in ${folder}: pnpm install && pnpm dashral init`)
}

console.log("")
if (run("node", ["scripts/dashral.mjs", "init", ...rest], target) !== 0) {
  fail(`The setup stopped. It's a fresh clone, so you can delete ${folder} and start again, or fix what it says and run \`pnpm dashral init\` in it.`)
}

console.log(`
Your dashboard is in ${folder}:
  cd ${folder}${own.install ? "" : "\n  pnpm install"}
  pnpm dev`)
