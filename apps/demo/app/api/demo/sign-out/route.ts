import { NextResponse, type NextRequest } from "next/server"

import { DEMO_COOKIE, isPrefetch } from "@/lib/demo-sign-in"

// Signs out of the hosted demo: the cookie goes, and so does the visitor, back to the sign-in page.
export function GET(request: NextRequest) {
  if (isPrefetch(request)) return new NextResponse(null, { status: 204 })
  const response = NextResponse.redirect(new URL("/login", request.url), 303)
  response.cookies.delete(DEMO_COOKIE)
  return response
}
