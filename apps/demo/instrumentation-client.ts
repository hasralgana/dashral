import { navigationStarted } from "@/lib/navigation-progress"

// Each page change: the progress line along the top sets off (components/navigation-progress.tsx).
export function onRouterTransitionStart(url: string) {
  navigationStarted(url)
}
