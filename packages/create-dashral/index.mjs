#!/usr/bin/env node
// `npx create-dashral my-app`: a new dashboard from Dashral's newest release, in one command. By default it makes a
// Next.js project of its own, like `create-next-app`: the release is cloned, `pnpm dashral init --layout flat` keeps
// only the app (the components come from npm as @dashral/ui), the project starts a Git history of its own and its
// dependencies are installed. With --monorepo it keeps the repository's layout and history instead, for
// `pnpm dashral update`. Nothing about the setup lives here: the release's scripts/dashral.mjs does it, so this file
// rarely needs a new version.
//
//   npx create-dashral my-app
//   npx create-dashral my-app --template inset --pages blank --languages en --name "Acme" --primary indigo
//   npx create-dashral my-app --monorepo                                   (the whole repository, for pnpm dashral update)
//   npx create-dashral my-app --pro --apps crm,kanban --name "Acme"        (Dashral Pro: needs your GitHub access)
//   npx create-dashral my-site --pro --template saas --name "Acme"        (Pro's SaaS landing website, on its own)

import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join, resolve } from "node:path"
import { argv, exit, platform, stdin, stdout, versions } from "node:process"
import { createInterface } from "node:readline/promises"

const repos = {
  free: "https://github.com/hasralgana/dashral.git",
  pro: "https://github.com/dashral-ui/dashral-pro.git",
}

const help = `Usage: npx create-dashral [folder] [options]

  Starts a new Next.js dashboard in [folder] (asked for when left out) from Dashral's newest release, as a project of its own (the components
  come from npm as @dashral/ui), and runs \`pnpm dashral init\`, which asks a few questions (or reads the flags below).

Options of create-dashral:
  --monorepo           Keep the whole repository (apps/, packages/) and its history, to bring in later releases
                       with \`pnpm dashral update\`
  --pro                Start from Dashral Pro: its private repository, as the monorepo, so \`pnpm dashral update\` brings
                       in new apps and their database migrations (Git needs to sign in to GitHub: see below)
  --pro --template saas
                       Dashral Pro's SaaS landing template on its own: the website as a Next.js project, like
                       create-next-app, without the dashboard (Dashral Pro 1.6.0 or newer)
  --release v1.2.0     An earlier release instead of the newest
  --from <url>         Clone another repository (a fork, or Pro over SSH: git@github.com:dashral-ui/dashral-pro.git)
  --no-install         Set up only; run \`pnpm install\` yourself

Every other option goes to \`pnpm dashral init\`:
  --template classic|inset|both  --pages demo|blank  --languages all|en  --customizer keep|remove
  --name "Your App"  --primary  --light  --dark  --card  --radius  --font  --yes
  Pro: --apps all|crm,kanban,…  --samples keep|remove

Dashral Pro: accept the repository invitation GitHub emailed you, then let Git sign in to GitHub once, with the
GitHub CLI (\`gh auth login\`) or over SSH (\`--from git@github.com:dashral-ui/dashral-pro.git\`).

The theme customizer's "Copy setup command" at https://demo.dashral.com writes these flags for you.
Docs: https://dashral.com/docs/installation`

// ── Arguments ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Flags that take no value: a word after one of these can be the folder; after any other flag, it's that flag's value. */
const switches = new Set(["help", "pro", "monorepo", "no-install", "yes", "force"])

/** This script's own flags, and the rest passed to `dashral init` as they were typed. */
function parseArgs(args) {
  const takesValue = (previous) => Boolean(previous?.startsWith("--") && !previous.includes("=") && !switches.has(previous.slice(2)))
  const own = { pro: false, monorepo: false, install: true, release: null, from: null, help: false }
  const rest = []
  let folder = null
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const [key, inline] = arg.startsWith("--") ? arg.slice(2).split(/=(.*)/s) : [null]
    const value = () => (inline !== undefined ? inline : args[++i])
    if (arg === "-h" || key === "help") own.help = true
    else if (key === "pro") own.pro = true
    else if (key === "monorepo") own.monorepo = true
    else if (key === "no-install") own.install = false
    else if (key === "release" || key === "from") {
      own[key] = value()
      if (!own[key] || own[key].startsWith("--")) fail(`--${key} needs a value.`)
    } else if (key === "layout") fail("Use --monorepo for the repository's layout; the project is flat without it.")
    else if (key === null && folder === null && !takesValue(args[i - 1])) folder = arg
    else rest.push(arg)
  }
  return { folder, own, rest }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function fail(message) {
  console.error(`\n✖ ${message}`)
  exit(1)
}

// Git never stops to ask for a username and password in the terminal (GitHub doesn't take passwords anyway): a
// credential helper that's set up (the GitHub CLI, Git Credential Manager, the macOS keychain) still signs in, and
// without one Git fails at once, so we can say what to do.
const gitEnv = { GIT_TERMINAL_PROMPT: "0" }

/** Runs a command in the terminal (its output and questions shown as they come); its exit code, or null. */
function run(command, args, cwd, quiet = false) {
  // Windows runs pnpm through a .cmd shim, which needs a shell. DASHRAL_CREATE: init leaves the next steps to us.
  const env = { ...process.env, ...gitEnv, DASHRAL_CREATE: "1" }
  const result = spawnSync(command, args, { cwd, env, stdio: quiet ? "ignore" : "inherit", shell: platform === "win32" })
  return result.error ? null : result.status
}

/** A command's output (null when it fails) and what it printed as errors. */
function capture(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", env: { ...process.env, ...gitEnv }, shell: platform === "win32" })
  return { out: result.status === 0 ? result.stdout.trim() : null, err: `${result.stderr ?? ""}${result.error?.message ?? ""}` }
}

/** A command's output, or null when it can't run. */
const output = (command, args) => capture(command, args).out

const versionOf = (tag) => tag.slice(1).split(".").map(Number)
const newer = (a, b) => {
  const [x, y] = [versionOf(a), versionOf(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const parsed = parseArgs(argv.slice(2))
const { own, rest } = parsed
let folder = parsed.folder
if (own.help) {
  console.log(help)
  exit(0)
}
// No folder given: ask for one in a terminal, as create-next-app does (Enter takes my-app); elsewhere, say how.
if (!folder) {
  if (!stdin.isTTY) {
    console.log(help)
    exit(1)
  }
  const rl = createInterface({ input: stdin, output: stdout })
  for (;;) {
    const answer = (await rl.question("What is your project named? (my-app) ")).trim() || "my-app"
    const path = resolve(answer)
    if (existsSync(path) && readdirSync(path).length) {
      console.log(`  ${answer} isn't empty. Pick a new name.`)
      continue
    }
    folder = answer
    break
  }
  rl.close()
}

if (Number(versions.node.split(".")[0]) < 20) fail(`Dashral needs Node.js 20 or newer (this is ${versions.node}).`)
if (output("git", ["--version"]) === null) fail("Git wasn't found. Install it from https://git-scm.com and run this again.")
if (own.install && output("pnpm", ["--version"]) === null) {
  fail("pnpm wasn't found. Turn it on with `corepack enable pnpm` (or `npm install -g pnpm`) and run this again.")
}

const target = resolve(folder)
if (existsSync(target) && readdirSync(target).length) fail(`${folder} isn't empty. Pick a new folder.`)

const url = own.from ?? (own.pro ? repos.pro : repos.free)
const ssh = /^(git@|ssh:\/\/)/.test(url)
const proRepo = repos.pro.replace(/\.git$/, "")
const access = own.pro ? " Check that your GitHub account has access to Dashral Pro (accept the invitation GitHub emailed you)." : ""

/** Why Git couldn't reach the repository, and what to do, from what it printed. */
function unreachable(err) {
  if (/could not resolve host|unable to access.*(timed out|resolve)|network is unreachable/i.test(err)) {
    return `Couldn't reach GitHub. Check your internet connection and run this again.`
  }
  if (!own.pro) return `Couldn't reach ${url}.${err.trim() ? `\n  Git said: ${err.trim().split("\n").at(-1)}` : ""}`
  if (ssh) {
    return `Git couldn't open Dashral Pro over SSH. Check that:
  1. You accepted the invitation: ${proRepo}/invitations
  2. Your SSH key is on that GitHub account (\`ssh -T git@github.com\` greets you by name).`
  }
  return `Git couldn't open Dashral Pro: it's a private repository, so Git has to sign in to GitHub as the account that has access.
  1. Accept the invitation (sent to the GitHub account you connected on Polar): ${proRepo}/invitations
  2. Let Git sign in to GitHub once. The simplest way is the GitHub CLI (https://cli.github.com):
       gh auth login        (choose HTTPS, and yes to authenticate Git)
     Or use SSH if your key is on GitHub:
       npx create-dashral ${folder} --pro --from git@github.com:dashral-ui/dashral-pro.git
  3. Run this again. Stuck? Write to hello@dashral.com.`
}

// The release: the newest version tag, or the one --release names.
if (own.pro) console.log(`Dashral Pro is a private repository: Git signs in to GitHub as the account you connected on Polar.`)
console.log(`Looking for the releases of ${url}…`)
const { out: listed, err: listError } = capture("git", ["ls-remote", "--tags", "--refs", url, "v*"])
if (listed === null) fail(unreachable(listError))
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

// --template saas: Pro's SaaS landing website on its own. It's a project of its own, so it's always flat.
const landing = rest.some((arg, i) => arg === "--template=saas" || (arg === "--template" && rest[i + 1] === "saas"))
if (landing && !own.pro) fail("The SaaS landing template comes with Dashral Pro: add --pro.")
if (landing && own.monorepo) fail("--template saas makes the website a project of its own. For it beside the dashboard, use --pro --monorepo without --template.")

let flat = !own.monorepo
if (flat && own.pro && !landing) {
  // Pro's updates are mostly its apps (new dashboards, fixes, database migrations): only the repository's history
  // lets `pnpm dashral update` merge them into a project. Pro blocks for an app you already have: the shadcn CLI.
  console.log("  Dashral Pro is set up as the monorepo, so `pnpm dashral update` can bring in new apps and their migrations.")
  flat = false
}

// Flat: the files are enough. The monorepo keeps the whole history: `pnpm dashral update` merges later releases into it.
console.log(`\nCloning Dashral ${release} into ${folder}…`)
const depth = flat ? ["--depth", "1"] : []
if (run("git", ["-c", "advice.detachedHead=false", "clone", "--quiet", ...depth, "--branch", release, url, target]) !== 0) fail(`Couldn't clone ${url}.${access}`)
if (flat && !readFileSync(join(target, "scripts/dashral.mjs"), "utf8").includes("--layout")) {
  // A release from before the flat layout: set it up as the monorepo.
  console.log(`  ${release} predates the flat layout, so it's set up as the monorepo.`)
  flat = false
  rmSync(target, { recursive: true, force: true })
  if (run("git", ["-c", "advice.detachedHead=false", "clone", "--quiet", "--branch", release, url, target]) !== 0) fail(`Couldn't clone ${url}.${access}`)
}
const restart = `It's a fresh copy, so you can delete ${folder} and start again.`
if (landing && !readFileSync(join(target, "scripts/dashral.mjs"), "utf8").includes("--template saas")) {
  rmSync(target, { recursive: true, force: true })
  fail(`${release} doesn't have the SaaS landing template yet: it came in Dashral Pro 1.6.0.`)
}

if (flat) {
  // Setting up needs no dependencies: install once, in the project as it ends up.
  console.log("")
  if (run("node", ["scripts/dashral.mjs", "init", "--layout", "flat", ...rest], target) !== 0) fail(`The setup stopped. ${restart}`)
  // The project's own history, from its first commit.
  rmSync(join(target, ".git"), { recursive: true, force: true })
  run("git", ["init", "--quiet", "-b", "main"], target)
  if (own.install) {
    console.log("\nInstalling the dependencies…")
    if (run("pnpm", ["install"], target) !== 0) fail(`pnpm install stopped. Fix what it says, then run \`pnpm install\` in ${folder}.`)
  }
  run("git", ["add", "-A"], target, true)
  const committed = run("git", ["commit", "--quiet", "-m", "Initial commit from create-dashral"], target, true) === 0
  console.log(`
Your ${landing ? "website" : "dashboard"} is in ${folder}:
  cd ${folder}${own.install ? "" : "\n  pnpm install"}
  pnpm dev${committed ? "" : "\n\n(Git has no name and email here yet, so nothing was committed: commit when you're ready.)"}`)
} else {
  // A tag checks out without a branch: start yours, so your commits have one.
  if (run("git", ["switch", "--quiet", "-c", "main"], target) !== 0) fail("Couldn't start the main branch.")
  if (own.pro && !own.install) {
    // Pro's setup rebuilds the database migrations for the apps you keep, with drizzle-kit: it needs the install first.
    const quote = (arg) => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : `"${arg.replace(/(["\\$`])/g, "\\$1")}"`)
    console.log(`
Dashral Pro is in ${folder}. Its setup needs the dependencies, so finish with:
  cd ${folder}
  pnpm install
  pnpm dashral init${rest.length ? ` ${rest.map(quote).join(" ")}` : ""}
  pnpm dev`)
    exit(0)
  }
  if (own.install) {
    console.log("\nInstalling the dependencies…")
    if (run("pnpm", ["install"], target) !== 0) fail(`pnpm install stopped. Fix what it says, then in ${folder}: pnpm install && pnpm dashral init`)
  }
  console.log("")
  if (run("node", ["scripts/dashral.mjs", "init", ...rest], target) !== 0) {
    fail(`The setup stopped. ${restart} Or fix what it says and run \`pnpm dashral init\` in it.`)
  }
  console.log(`
Your dashboard is in ${folder}:
  cd ${folder}${own.install ? "" : "\n  pnpm install"}
  pnpm dev`)
}
