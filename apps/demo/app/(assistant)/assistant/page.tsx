import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AssistantView } from "@/components/assistant/assistant-view"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("assistant")
  return { title: t("title"), description: t("description") }
}

// A page of its own, like a chat app: the frame and its header are app/(assistant)/layout.tsx.
export default function AssistantPage() {
  return <AssistantView />
}
