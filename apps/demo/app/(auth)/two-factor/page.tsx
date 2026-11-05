import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TwoFactorForm } from "@/components/auth/two-factor-form"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("verify"))("meta") }
}

export default function TwoFactorPage() {
  return <TwoFactorForm />
}
