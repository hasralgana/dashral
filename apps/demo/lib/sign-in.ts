// @dashral-if hosted
import { demoSignIn } from "@/lib/demo-sign-in"
// @dashral-end

// Where the sign-in and sign-up forms and the account menu's Sign out go: connect them to your sign-in here, a route
// or a server action (README.md → Add sign-in). Until then the forms open the dashboard and Sign out the sign-in page.

/** The sign-in and sign-up forms (the social buttons go to the same place). */
export const signInForm: { action: string; method?: "post" } = { action: "/" }

/** Where Sign out goes. */
export const signOut = { href: "/login" }

// @dashral-if hosted
// The hosted demo (demo.dashral.com) signs in for real, with a cookie and no accounts (lib/demo-sign-in.ts).
if (demoSignIn) {
  signInForm.action = "/api/demo/sign-in"
  signInForm.method = "post"
  signOut.href = "/api/demo/sign-out"
}
// @dashral-end
