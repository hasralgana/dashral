import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ApiKeysView } from "@/components/inset/api-keys-view"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.apiKeys")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default function InsetApiKeysPage() {
  return <ApiKeysView />
}
