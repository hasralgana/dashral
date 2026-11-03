import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageHeader } from "@/components/page-header"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { settingsTabs, type SettingsTab } from "@/components/settings/tabs"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("title"), description: t("description") }
}

type Props = { searchParams: Promise<{ tab?: string }> }

export default async function SettingsPage({ searchParams }: Props) {
  const t = await getTranslations("settings")
  const { tab } = await searchParams
  const current: SettingsTab = settingsTabs.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile"

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="w-full">
        <SettingsTabs tab={current} />
      </div>
    </>
  )
}
