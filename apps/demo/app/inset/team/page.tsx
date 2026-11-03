import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TeamView } from "@/components/inset/team-view"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.team")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default function InsetTeamPage() {
  return <TeamView />
}
