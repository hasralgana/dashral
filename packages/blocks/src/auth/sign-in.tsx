"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Alert } from "@dashral/ui/components/alert"
import { Button } from "@dashral/ui/components/button"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Input } from "@dashral/ui/components/input"
import { Separator } from "@dashral/ui/components/separator"

const google = (
  <svg viewBox="0 0 24 24" aria-hidden className="size-4">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
  </svg>
)
const github = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)

export type SignInValues = { email: string; password: string; remember: boolean }

export type SignInProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** The buttons above the form; none hides them and the "or" under them. */
  providers?: { id: string; label: string; icon?: React.ReactNode }[]
  /** Called with a provider's id when its button is pressed, e.g. to start its sign-in. */
  onProvider?: (id: string) => void
  /**
   * Your sign-in. Resolve to sign in (the card says so); throw an Error to show its message above the form. Without
   * it, the card plays a sample: any email with the password "password".
   */
  onSubmit?: (values: SignInValues) => Promise<void> | void
  /** Where "Forgot password?" and "Create an account" go; none hides them. */
  forgotHref?: string
  signUpHref?: string
  /** The words before "Create an account". */
  signUpPrompt?: string
  /** What the card says once signed in. */
  done?: { title: string; description?: string }
}

/**
 * A sign-in card: providers such as Google and GitHub, or email and password with "Forgot password?" by the label, a
 * remember-me box and a loading state. An error shows above the form. Every part comes from props; wire `onSubmit`
 * to your auth (without it, try any email with the password "password").
 */
export function SignIn({
  title = "Welcome back",
  description = "Sign in to your Acme workspace",
  providers = [
    { id: "google", label: "Google", icon: google },
    { id: "github", label: "GitHub", icon: github },
  ],
  onProvider,
  onSubmit,
  forgotHref = "#",
  signUpHref = "#",
  signUpPrompt = "New to Acme?",
  done = { title: "Signed in", description: "Taking you to your dashboard…" },
}: SignInProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [state, setState] = useState<"idle" | "loading" | "wrong" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState("loading")
    if (!onSubmit) {
      window.setTimeout(() => {
        setError(password === "password" ? null : "That password isn't right")
        setState(password === "password" ? "done" : "wrong")
      }, 800)
      return
    }
    try {
      await onSubmit({ email, password, remember })
      setState("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you in")
      setState("wrong")
    }
  }

  return (
    <section className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="grid gap-5 rounded-2xl border bg-card p-6 shadow-sm">
          {state === "done" ? (
            <Alert color="success" title={done.title} description={done.description} />
          ) : (
            <>
              {providers.length > 0 && (
                <>
                  <div className="grid grid-cols-[repeat(var(--count),minmax(0,1fr))] gap-2" style={{ "--count": Math.min(providers.length, 2) } as React.CSSProperties}>
                    {providers.map((provider) => (
                      <Button key={provider.id} variant="outline" onClick={() => onProvider?.(provider.id)}>
                        {provider.icon} {provider.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground uppercase">or</span>
                    <Separator className="flex-1" />
                  </div>
                </>
              )}
              {state === "wrong" && error && <Alert color="destructive" title={error} description={onSubmit ? undefined : "Try again, or reset it."} />}
              <form noValidate onSubmit={submit} className="grid gap-4">
                <Input label="Email" type="email" autoComplete="email" placeholder="olivia@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input
                  label="Password"
                  labelAction={
                    forgotHref && (
                      <a href={forgotHref} className="font-medium text-primary-text underline-offset-4 hover:underline">
                        Forgot password?
                      </a>
                    )
                  }
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (state === "wrong") setState("idle")
                  }}
                  aria-invalid={state === "wrong" || undefined}
                  required
                />
                <Checkbox label="Keep me signed in on this device" checked={remember} onCheckedChange={(on) => setRemember(on === true)} />
                <Button type="submit" loading={state === "loading"} disabled={!email || !password}>
                  Sign in
                </Button>
              </form>
            </>
          )}
        </div>
        {signUpHref && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signUpPrompt}{" "}
            <a href={signUpHref} className="font-medium text-primary-text underline-offset-4 hover:underline">
              Create an account
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
