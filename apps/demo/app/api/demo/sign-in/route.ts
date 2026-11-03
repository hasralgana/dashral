import { NextResponse, type NextRequest } from "next/server"

import { DEMO_COOKIE, isPrefetch, safeNext } from "@/lib/demo-sign-in"

// Signs in to the hosted demo (lib/demo-sign-in.ts): no account to check, only the cookie proxy.ts looks for. POST from
// the sign-in and sign-up forms, GET from the Google, GitHub and passkey buttons (links). Where to go after is the
// sign-in page's own ?next= (proxy.ts set it), read from the Referer, so that page can stay static.

function nextFrom(request: NextRequest) {
  const referer = request.headers.get("referer")
  try {
    return referer ? new URL(referer).searchParams.get("next") : null
  } catch {
    return null
  }
}

function signIn(request: NextRequest, next: string | null) {
  // 303: after a form's POST, the browser follows with a GET.
  const response = NextResponse.redirect(new URL(safeNext(next), request.url), 303)
  response.cookies.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}

export function POST(request: NextRequest) {
  return signIn(request, nextFrom(request))
}

export function GET(request: NextRequest) {
  if (isPrefetch(request)) return new NextResponse(null, { status: 204 })
  return signIn(request, nextFrom(request))
}
