import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { FilesView } from "@/components/files/files-view"
import { PageHeader } from "@/components/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("files")
  return { title: t("title"), description: t("description") }
}

type Props = { searchParams: Promise<{ folder?: string }> }

export default async function FilesPage({ searchParams }: Props) {
  const { folder } = await searchParams
  const t = await getTranslations("files")

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <FilesView folderId={folder ?? "root"} />
    </>
  )
}
