# create-dashral

Start a new [Dashral](https://dashral.com) admin dashboard (Next.js, React, TypeScript, Tailwind CSS) in one command:

```bash
npx create-dashral my-app
cd my-app
pnpm dev
```

Leave out the folder and it asks for the project's name first (Enter takes `my-app`). Then it asks which template to keep (Classic, Inset or both), demo pages or a blank page, the languages, your app's name
and its look, then makes a Next.js project laid out like a new Next.js app, with its own Git history:

```
my-app/
├── app/            pages
├── components/     the app's own components
├── lib/  messages/  public/
├── package.json    "@dashral/ui" from npm
└── next.config.ts  tsconfig.json
```

The UI components come from [`@dashral/ui`](https://www.npmjs.com/package/@dashral/ui)
(`import { Button } from "@dashral/ui/components/button"`): `pnpm up @dashral/ui` brings in new ones and fixes. You need
**Node.js 20+**, **Git** and **pnpm** (`corepack enable pnpm`).

Every answer is also a flag, so it can run without questions:

```bash
npx create-dashral my-app --template inset --pages blank --languages en --name "Acme" --primary indigo
```

The theme customizer's **Copy setup command** in the [live demo](https://demo.dashral.com) writes these flags for you.

| Option | |
| --- | --- |
| `--monorepo` | Keep Dashral's whole repository (`apps/`, `packages/`) and history instead, so `pnpm dashral update` can bring in later releases, pages too ([Getting updates](https://github.com/hasralgana/dashral#getting-updates)) |
| `--pro` | Start from Dashral Pro, as the monorepo, so `pnpm dashral update` brings in new apps and their database migrations. It's a private repository: accept the invitation GitHub emailed you, then let Git sign in to GitHub once with `gh auth login` (or use `--from` with SSH) |
| `--release v1.2.0` | An earlier release instead of the newest |
| `--from <url>` | Clone another repository, e.g. a fork, or Pro over SSH |
| `--no-install` | Skip `pnpm install` |

Any other option goes to `pnpm dashral init`; `npx create-dashral --help` lists them.

MIT licensed.
