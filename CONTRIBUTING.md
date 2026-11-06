# Contributing to Dashral

Thanks for your interest in improving Dashral! Bug reports, ideas and pull requests are all welcome.

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Development setup

```bash
corepack enable pnpm
pnpm install
pnpm dev        # http://localhost:3000
```

Before opening a pull request, make sure these pass (CI runs the same on every pull request):

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Project layout

- `apps/demo` — the Next.js dashboard app (the template): the Classic pages in `app/(dashboard)`, Inset's in `app/inset`
- `packages/ui` — `@dashral/ui`, shared components and theme tokens
- `packages/blocks` — `@dashral/blocks`, the free blocks (each listed in `src/free.ts`), built from the components
- `packages/typescript-config` — shared tsconfig presets
- `scripts/dashral.mjs` — `pnpm dashral init` and `pnpm dashral update`, which turn the demo into someone's own app
- `packages/create-dashral` — `npx create-dashral my-app`, published on npm: clones the newest `v*` tag, installs it and runs
  `scripts/dashral.mjs init` with the flags given

## Guidelines

- **Keep changes focused.** One feature or fix per pull request.
- **Match the existing style.** Components follow the shadcn/ui conventions used in `packages/ui`.
- **Use theme tokens**, not hard-coded colors, so light and dark mode keep working.
- **Accessibility matters.** Interactive elements need keyboard support and labels; status should never rely on color alone.
- **Keep `pnpm dashral init` working.** Code that belongs to one template, the demo pages, the languages or the theme
  customizer, in a file the others share (the menu in `lib/nav.ts`, say), goes between `// @dashral-if <feature>` and
  `// @dashral-end` (features: `classic`, `inset`, `switcher`, `i18n`, `customizer`, `demo`; `{/* … */}` in JSX).
  A new page of one template goes in that template's folder. Check a change with
  `pnpm dashral init --template inset --pages blank --yes` in a copy, then `pnpm typecheck` there.
- **Keep `npx create-dashral` working.** It relies on the release tags (`vX.Y.Z`), on `scripts/dashral.mjs init` and its
  flags (`--layout flat` above all), and on `pnpm install`: a renamed flag keeps its old name working. Releases need
  nothing from it; a change to its own `index.mjs` gets a new version in its `package.json` and an `npm publish` from
  that folder.
- **The dashboard imports only published packages.** `apps/demo` may import `@dashral/ui` and `@dashral/motion` (both on
  npm) and its own files, nothing else from `packages/` (copy a block into the app instead): `--layout flat` turns
  those imports into npm dependencies. Check a change with `pnpm dashral init --layout flat --yes` in a copy, then
  `pnpm install && pnpm typecheck` there (until the release is on npm, point `@dashral/ui` at `pnpm pack`'s tarball).
- **`@dashral/ui` and `@dashral/motion` are published from `dist/`.** `pnpm build:npm` in the package builds it (one file
  per component, so a new component needs nothing else); keep its imports relative inside the package, and a component
  that uses hooks or events starts with `"use client"`. They're published with `pnpm publish` (not npm: it turns
  `workspace:^` and `publishConfig` into what npm needs) at each release, at the release's version.
- **Update `CHANGELOG.md`** under `[Unreleased]` for user-facing changes, as described [below](#changelog).

## Changelog

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

- Add your line under `## [Unreleased]`, in the same pull request as the change.
- Use these sections, in this order and only when needed: Added, Changed, Deprecated, Removed, Fixed, Security.
- Write one line per change for people using Dashral. Start with what it's about and say what they can do now:
  `- Text Reveal: a "wipe" variant that draws the line in from its start`. Call a new component by its name in the
  docs.
- Put a breaking change under Changed and start it with `**Breaking:**`, then say what to change in your code.
- Leave out refactors, tooling, tests and typo fixes. No commit hashes or issue numbers.

Versions: a patch (`1.0.x`) is for fixes, a minor (`1.x.0`) brings new components, blocks and dashboards, and a
major (`x.0.0`) is only for a breaking component API change.

## Questions

Have a question or an idea? Start a thread in [GitHub Discussions](https://github.com/hasralgana/dashral/discussions) — issues are reserved for bugs and concrete feature requests.

## Reporting bugs

Open an issue using the bug report template and include steps to reproduce. For security issues, see [SECURITY.md](SECURITY.md) instead.
