import type { Metadata } from "next"
import { Boxes, PackageX, TriangleAlert, Wallet } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { MetricCard } from "@dashral/ui/components/metric-card"

import { InventoryView } from "@/components/inventory/inventory-view"
import { PageHeader } from "@/components/page-header"
import { getIntlLocale, getMoneyLocale } from "@/lib/i18n-server"
import { items, stockStatus } from "@/lib/inventory-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventory")
  return { title: t("title"), description: t("description") }
}

export default async function InventoryPage() {
  const t = await getTranslations("inventory")
  const locale = await getIntlLocale()
  const money = await getMoneyLocale()
  const value = items.reduce((sum, item) => sum + item.onHand * item.unitCost, 0)
  const count = (status: string) => items.filter((item) => stockStatus(item) === status).length

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("metrics.label")}>
        <MetricCard label={t("metrics.skus")} value={items.length} locale={locale} icon={<Boxes />} countOnMount>
          <p className="text-xs text-muted-foreground">{t("metrics.skusHint", { count: 3 })}</p>
        </MetricCard>
        <MetricCard
          label={t("metrics.value")}
          value={Math.round(value)}
          locale={money}
          formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          change={3.1}
          changeLabel={t("metrics.vsLastMonth")}
          icon={<Wallet />}
          countOnMount
        />
        <MetricCard label={t("metrics.low")} value={count("low")} locale={locale} icon={<TriangleAlert />} countOnMount>
          <p className="text-xs text-muted-foreground">{t("metrics.lowHint")}</p>
        </MetricCard>
        <MetricCard label={t("metrics.out")} value={count("out")} locale={locale} icon={<PackageX />} countOnMount>
          <p className="text-xs text-muted-foreground">{t("metrics.outHint")}</p>
        </MetricCard>
      </section>
      <InventoryView />
    </>
  )
}
