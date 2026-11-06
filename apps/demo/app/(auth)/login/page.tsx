import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Input } from "@dashral/ui/components/input"

import { SocialSignIn } from "@/components/auth/social-sign-in"
// @dashral-if hosted
import { demoAccount, demoSignIn } from "@/lib/demo-sign-in"
// @dashral-end
import { signInForm } from "@/lib/sign-in"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.login"))("meta") }
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login")
  // Where the form goes: lib/sign-in.ts.
  return (
    <Card
      title={t("title")}
      description={t("description")}
      classNames={{ header: "text-center", title: "text-xl", body: "space-y-5" }}
    >
      {/* @dashral-if hosted */}
      {/* The hosted demo fills in its account (lib/demo-sign-in.ts). */}
      {demoSignIn && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">{t("demo")}</p>
      )}
      {/* @dashral-end */}
      <SocialSignIn passkey action={signInForm.action} />
      <form action={signInForm.action} method={signInForm.method} className="space-y-4">
        <Input
          label={t("email")}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          // @dashral-if hosted
          defaultValue={demoSignIn ? demoAccount.email : undefined}
          // @dashral-end
          required
        />
        <Input
          label={t("password")}
          labelAction={
            <Link href="#" className="hover:text-foreground">
              {t("forgot")}
            </Link>
          }
          type="password"
          autoComplete="current-password"
          // @dashral-if hosted
          defaultValue={demoSignIn ? demoAccount.password : undefined}
          // @dashral-end
          required
        />
        <Checkbox label={t("remember")} />
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("signUp")}
        </Link>
      </p>
    </Card>
  )
}
