# create-dashral

Start a new [Dashral](https://dashral.com) admin dashboard (Next.js, React, TypeScript, Tailwind CSS) in one command:

```bash
npx create-dashral my-app
cd my-app
pnpm dev
```

It clones Dashral's newest release into `my-app`, installs the dependencies and runs `pnpm dashral init`. That asks
which template to keep (Classic, Inset or both), demo pages or a blank page, the languages, your app's name and its
look. You need **Node.js 20+**, **Git** and **pnpm** (`corepack enable pnpm`).

Every answer is also a flag, so it can run without questions:

```bash
npx create-dashral my-app --template inset --pages blank --languages en --name "Acme" --primary indigo
```

The theme customizer's **Copy setup command** in the [live demo](https://demo.dashral.com) writes these flags for you.

| Option | |
| --- | --- |
| `--pro` | Start from Dashral Pro (your GitHub account needs access to it) |
| `--release v1.2.0` | An earlier release instead of the newest |
| `--from <url>` | Clone another repository, e.g. a fork, or Pro over SSH |
| `--no-install` | Skip `pnpm install` |

Any other option goes to `pnpm dashral init`; `npx create-dashral --help` lists them.

The project keeps the release's Git history, so later releases come in with `pnpm dashral update`. See
[Getting updates](https://github.com/hasralgana/dashral#getting-updates).

MIT licensed.
