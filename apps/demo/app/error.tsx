"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { RotateCcw, ServerCrash } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

import { ErrorPage } from "@/components/error-page"

// Error boundary for every route: shows the 500 screen with a retry.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors")
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorPage
      code="500"
      icon={ServerCrash}
      title={t("server.title")}
      description={t("server.description")}
    >
      <Button onClick={reset}>
        <RotateCcw /> {t("retry")}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </ErrorPage>
  )
}
