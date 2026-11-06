# @dashral/motion

Motion editions of [@dashral/ui](https://www.npmjs.com/package/@dashral/ui)'s components, on `motion/react`: buttons
you can press and hold, switches you can drag, tabs and menus that sweep. Same props as the plain components, and they
respect reduced motion. See them live at [dashral.com/docs/motion](https://dashral.com/docs/motion).

```bash
npm install @dashral/ui @dashral/motion
```

Import the styles after `@dashral/ui`'s:

```css
@import "@dashral/ui/globals.css";
@import "@dashral/motion/styles.css";
```

Then swap the import of the component you want animated:

```tsx
import { Button } from "@dashral/motion/components/button"

export function Save() {
  return <Button>Save changes</Button>
}
```

Each edition is also in Dashral's shadcn registry, to copy and change: see
[Installation](https://dashral.com/docs/installation).

MIT licensed.
