#!/usr/bin/env node
// Builds a kit package (packages/ui or packages/motion) for npm, into its dist/: one .js and one .d.ts per source file,
// in the same folders as src/, so `@dashral/ui/components/button` stays one small file and "use client" stays at the
// top of each. The CSS is copied as it is; globals.css's `@source "../components"` then points at dist/components, so
// Tailwind finds the classes inside node_modules.
//
// Run from the package's folder: `pnpm build:npm` (it runs before `pnpm publish` too, as prepack). Inside this
// repository the apps keep importing src/ directly; only the published package uses dist/ (package.json →
// publishConfig.exports).

import { execFileSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { cwd, exit } from "node:process"
import { createRequire } from "node:module"

const root = cwd()
const src = join(root, "src")
const dist = join(root, "dist")
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
if (!existsSync(src)) {
  console.error(`✖ No src/ in ${root}: run this from packages/ui or packages/motion.`)
  exit(1)
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

rmSync(dist, { recursive: true, force: true })

// 1. TypeScript: the JavaScript and the type declarations. A package that imports another kit package
// (@dashral/motion → @dashral/ui) reads that one's built declarations, so build @dashral/ui first.
const kitDeps = Object.keys(pkg.dependencies ?? {}).filter((name) => name.startsWith("@dashral/"))
const paths = {}
for (const name of kitDeps) {
  const folder = join(root, "..", name.split("/")[1], "dist")
  if (!existsSync(folder)) {
    console.error(`✖ ${name} isn't built yet: run \`pnpm build:npm\` in packages/${name.split("/")[1]} first.`)
    exit(1)
  }
  paths[`${name}/*`] = [`${relative(root, folder)}/*`]
}
const config = join(root, "tsconfig.build.json")
writeFileSync(
  config,
  `${JSON.stringify(
    {
      extends: "./tsconfig.json",
      compilerOptions: {
        noEmit: false,
        incremental: false,
        declaration: true,
        rootDir: "src",
        outDir: "dist",
        ...(kitDeps.length ? { paths } : {}),
      },
      include: ["src"],
    },
    null,
    2,
  )}\n`,
)
try {
  const tsc = createRequire(join(root, "package.json")).resolve("typescript/bin/tsc")
  execFileSync(process.execPath, [tsc, "-p", config], { cwd: root, stdio: "inherit" })
} catch {
  console.error("✖ TypeScript stopped: fix the errors above.")
  exit(1)
} finally {
  rmSync(config, { force: true })
}

// 2. Relative imports get their .js: Node and webpack read a "type": "module" package's imports as written.
const relativeImport = /((?:from|import)\s*\(?\s*)(["'])(\.{1,2}\/[^"']+?)\2/g
let rewritten = 0
for (const file of walk(dist).filter((path) => /\.(js|d\.ts)$/.test(path))) {
  const text = readFileSync(file, "utf8")
  const next = text.replace(relativeImport, (match, before, quote, path) => {
    if (/\.(js|css|json)$/.test(path)) return match
    if (!existsSync(join(dirname(file), `${path}.js`)) && !existsSync(join(dirname(file), `${path}.d.ts`))) {
      console.error(`✖ ${relative(root, file)} imports ${path}, which wasn't built.`)
      exit(1)
    }
    rewritten++
    return `${before}${quote}${path}.js${quote}`
  })
  if (next !== text) writeFileSync(file, next)
}

// 3. The CSS, as it is.
let css = 0
for (const file of walk(src).filter((path) => path.endsWith(".css"))) {
  const to = join(dist, relative(src, file))
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(file, to)
  css++
}

// 4. Every source file that needs "use client" still starts with it.
for (const file of walk(src).filter((path) => /\.tsx?$/.test(path))) {
  if (!readFileSync(file, "utf8").startsWith('"use client"')) continue
  const built = join(dist, relative(src, file)).replace(/\.tsx?$/, ".js")
  if (!readFileSync(built, "utf8").startsWith('"use client"')) {
    console.error(`✖ ${relative(root, built)} lost its "use client".`)
    exit(1)
  }
}

const count = walk(dist).filter((path) => path.endsWith(".js")).length
console.log(`✔ ${pkg.name}: ${count} modules, ${css} stylesheets, ${rewritten} imports given their .js, in dist/.`)
