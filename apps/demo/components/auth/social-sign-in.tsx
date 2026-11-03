"use client"

import Link from "next/link"
import { KeyRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { cn } from "@dashral/ui/lib/utils"

import { AppleIcon, GitHubIcon, GoogleIcon } from "@/components/icons"

export type SocialProvider = "google" | "apple" | "github"
export type SignInMethod = "passkey" | SocialProvider

export const socialProviders = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "apple", label: "Apple", Icon: AppleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
] as const

/**
 * Passkey and social sign-in, above the email form: "Sign in with a passkey" across the top (sign-in only), the
 * providers in a row under it, then an "or" divider. `action` is what a button does — a function (real sign-in) or a
 * link (a demo). Each button describes itself in full for screen readers ("Continue with Google").
 */
export function SocialSignIn({
  providers = ["google", "apple", "github"],
  passkey = false,
  action,
  pending = null,
  className,
}: {
  providers?: SocialProvider[]
  passkey?: boolean
  action: ((method: SignInMethod) => void) | string
  /** The method being signed in with: its button shows a spinner and the others wait. */
  pending?: SignInMethod | null
  className?: string
}) {
  const t = useTranslations("auth.social")
  const shown = socialProviders.filter((p) => providers.includes(p.id))
  if (!passkey && shown.length === 0) return null

  const button = (method: SignInMethod, label: string, children: React.ReactNode, buttonClass?: string) =>
    typeof action === "string" ? (
      <Button key={method} variant="outline" className={cn("w-full text-[13px] [&_svg:not([class*='size-'])]:size-3.5", buttonClass)} asChild>
        <Link href={action} aria-label={label}>
          {children}
        </Link>
      </Button>
    ) : (
      <Button
        key={method}
        type="button"
        variant="outline"
        className={cn("w-full text-[13px] [&_svg:not([class*='size-'])]:size-3.5", buttonClass)}
        aria-label={label}
        loading={pending === method}
        disabled={pending !== null && pending !== method}
        onClick={() => action(method)}
      >
        {children}
      </Button>
    )

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="grid gap-2.5">
        {passkey &&
          button(
            "passkey",
            t("passkey"),
            <>
              <KeyRound aria-hidden /> {t("passkey")}
            </>
          )}
        {shown.length > 0 && (
          // When the row is narrow (a phone), the buttons show just the brand marks; their labels stay for screen readers.
          <div className="@container">
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
              {shown.map(({ id, label, Icon }) =>
                button(
                  id,
                  t("continueWith", { provider: label }),
                  <>
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate @max-[20rem]:sr-only">{label}</span>
                  </>,
                  "px-2"
                )
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-divider" /> {t("or")} <span className="h-px flex-1 bg-divider" />
      </div>
    </div>
  )
}
