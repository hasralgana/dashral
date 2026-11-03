import type { Metadata } from "next"
import { Sparkles, TriangleAlert, Users, Wallet } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { CustomersView } from "@/components/inset/customers-view"
import { InsetMetric } from "@/components/inset/inset-metric"
import { PageHeader } from "@/components/page-header"
import { getFormats, getIntlLocale, getMoneyLocale } from "@/lib/i18n-server"
import { customers } from "@/lib/inset-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.customers")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

export default async function InsetCustomersPage() {
  const t = await getTranslations("inset.customers")
  const format = await getFormats()
  const locale = await getIntlLocale()
  const money = await getMoneyLocale()
  const paying = customers.filter((c) => c.mrr > 0)
  const mrr = paying.reduce((sum, c) => sum + c.mrr, 0)
  const count = (status: string) => customers.filter((c) => c.status === status).length

  const summary = [
    { label: t("summary.total"), value: customers.length, icon: Users, hint: t("summary.paying", { count: format.number(paying.length) }) },
    {
      label: t("summary.mrr"),
      value: mrr,
      icon: Wallet,
      currency: true,
      hint: t("summary.perCustomer", { amount: format.currency(Math.round(mrr / paying.length)) }),
    },
    { label: t("summary.atRisk"), value: count("atRisk"), icon: TriangleAlert, hint: t("summary.atRiskHint") },
    { label: t("summary.trials"), value: count("trial"), icon: Sparkles, hint: t("summary.trialsHint") },
  ]

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary.map((item) => (
          <InsetMetric
            key={item.label}
            label={item.label}
            value={item.value}
            locale={item.currency ? money : locale}
            formatOptions={item.currency ? { style: "currency", currency: "USD", maximumFractionDigits: 0 } : undefined}
            icon={<item.icon />}
          >
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </InsetMetric>
        ))}
      </section>
      <CustomersView />
    </>
  )
}
