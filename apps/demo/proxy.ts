import { NextResponse, type NextRequest } from "next/server"

import { DEMO_COOKIE, demoSignIn } from "@/lib/demo-sign-in"

const publicPaths = new Set(["/login", "/register", "/two-factor"])

/**
 * The hosted demo's front door (lib/demo-sign-in.ts): signed out, every page sends you to /login first, then back
 * where you were going. Off unless NEXT_PUBLIC_DEMO_SIGN_IN=true, so a copy of the template is never gated.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!demoSignIn || publicPaths.has(pathname) || request.cookies.has(DEMO_COOKIE)) return NextResponse.next()
  const login = new URL("/login", request.url)
  if (pathname !== "/") login.searchParams.set("next", pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  // Everything but the API, Next.js internals and the metadata images, so link previews still find their card.
  matcher: [
    "/((?!api/|_next/|favicon\\.ico|icon\\.svg|apple-icon|opengraph-image|twitter-image|manifest\\.webmanifest|.*\\.(?:js|png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
}
