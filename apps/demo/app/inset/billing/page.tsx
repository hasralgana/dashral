import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { BillingView } from "@/components/inset/billing-view"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.billing")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default function InsetBillingPage() {
  return <BillingView />
}
