// The hosted demo's sign-in (demo.dashral.com). With NEXT_PUBLIC_DEMO_SIGN_IN=true, a visitor lands on /login with
// the demo account filled in, the way a real app greets them; signing in sets a cookie that proxy.ts looks for, and
// signing out clears it. Off by default, so a copy of the template opens straight on its dashboard. There's no account
// behind it: this dashboard has no database (Dashral Pro has real sign-in).

/** Read at build time (NEXT_PUBLIC_*): set it in the demo's own deployment only. */
export const demoSignIn = process.env.NEXT_PUBLIC_DEMO_SIGN_IN === "true"

import { account } from "@/lib/account"

/** The account the demo signs in as, the same one the account menu shows. */
export const demoAccount = { ...account, password: "dashral-demo" }

export const DEMO_COOKIE = "dashral-demo-session"

/** Where to go after signing in: a path on this site, or the dashboard. Never another site (an open redirect). */
export function safeNext(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/"
}

/**
 * Next's <Link> prefetches what it shows, and these routes change the cookie: a prefetch must change nothing, or
 * opening the account menu would sign you out (its Sign out link prefetched) and the sign-in page would sign you in.
 */
export const isPrefetch = (request: Request) => request.headers.has("next-router-prefetch")
