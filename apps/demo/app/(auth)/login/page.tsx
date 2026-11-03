import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Input } from "@dashral/ui/components/input"

import { SocialSignIn } from "@/components/auth/social-sign-in"
import { demoAccount, demoSignIn } from "@/lib/demo-sign-in"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.login"))("meta") }
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login")
  // The hosted demo signs in for real (a cookie, lib/demo-sign-in.ts) with its account filled in; elsewhere this is a
  // page to build on, whose buttons open the dashboard.
  const action = demoSignIn ? "/api/demo/sign-in" : "/"
  return (
    <Card
      title={t("title")}
      description={t("description")}
      classNames={{ header: "text-center", title: "text-xl", body: "space-y-5" }}
    >
      {demoSignIn && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">{t("demo")}</p>
      )}
      <SocialSignIn passkey action={action} />
      <form action={action} method={demoSignIn ? "post" : undefined} className="space-y-4">
        <Input
          label={t("email")}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          defaultValue={demoSignIn ? demoAccount.email : undefined}
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
          defaultValue={demoSignIn ? demoAccount.password : undefined}
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
