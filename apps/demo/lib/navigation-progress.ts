/**
 * The page-change signal between the router and the progress line (components/navigation-progress.tsx).
 * instrumentation-client.ts calls `navigationStarted` when the router sets off; the line listens on the window, so
 * the two never need to share a module.
 */
export const navigationStartEvent = "dashral:navigation-start"

/** Tell the progress line a page change has begun. `href` is where it's going. */
export function navigationStarted(href: string) {
  window.dispatchEvent(new CustomEvent<string>(navigationStartEvent, { detail: href }))
}

/** Whether `href` is another page than the one open now: the same page, or only another #anchor on it, isn't. */
export function leavesThisPage(href: string) {
  try {
    const next = new URL(href, window.location.href)
    return next.origin !== window.location.origin || next.pathname !== window.location.pathname || next.search !== window.location.search
  } catch {
    return false
  }
}
