import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Input } from "@dashral/ui/components/input"

import { SocialSignIn } from "@/components/auth/social-sign-in"
import { signInForm } from "@/lib/sign-in"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.register"))("meta") }
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register")
  return (
    <Card
      title={t("title")}
      description={t("description")}
      classNames={{ header: "text-center", title: "text-xl", body: "space-y-5" }}
    >
      {/* Where the form goes: lib/sign-in.ts. */}
      <SocialSignIn action={signInForm.action} />
      <form action={signInForm.action} method={signInForm.method} className="space-y-4">
        <Input label={t("name")} placeholder={t("namePlaceholder")} autoComplete="name" required />
        <Input label={t("email")} type="email" placeholder="you@example.com" autoComplete="email" required />
        <Input
          label={t("password")}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          description={t("passwordHint")}
        />
        <Checkbox label={t("terms")} required />
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  )
}
