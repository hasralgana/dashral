# @dashral/ui

Accessible React components for dashboards and apps, styled with Tailwind CSS v4: forms, data tables, charts, menus,
dialogs and more, in light and dark. Docs and live examples for every component: [dashral.com](https://dashral.com/components).

You need React 19, Tailwind CSS v4 and TypeScript (any framework: Next.js, Vite, React Router, …).

```bash
npm install @dashral/ui
```

Import the styles once, in the CSS file that imports Tailwind (instead of `@import "tailwindcss"`; it imports it for
you):

```css
@import "@dashral/ui/globals.css";
@import "@dashral/ui/themes.css"; /* optional: presets picked with data attributes, e.g. <html data-primary="indigo"> */
```

Then use a component, one import each:

```tsx
import { Button } from "@dashral/ui/components/button"
import { Select } from "@dashral/ui/components/select"

export function Toolbar() {
  return (
    <>
      <Select label="Plan" options={["Free", "Pro", "Team"]} />
      <Button>Save changes</Button>
    </>
  )
}
```

Server components work: the interactive components are marked `"use client"`. Update with `npm update @dashral/ui`.

## Prefer to own the code?

Every component is also in Dashral's shadcn registry, copied into your project for you to change:
`npx shadcn add https://dashral.com/r/button.json`. See [Installation](https://dashral.com/docs/installation).

Animated editions of the components: [@dashral/motion](https://www.npmjs.com/package/@dashral/motion). A whole admin
dashboard built from them: `npx create-dashral my-app`.

MIT licensed.
