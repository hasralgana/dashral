import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Check, Minus } from "lucide-react"
import { Accordion } from "@dashral/ui/components/accordion"
import { Card } from "@dashral/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"

import { PageHeader } from "@/components/page-header"
import { PricingPlans } from "@/components/pricing/pricing-plans"
import { getFormats } from "@/lib/i18n-server"
import { comparison, faqs, plans } from "@/lib/pricing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing")
  return { title: t("title"), description: t("metaDescription") }
}

/** A pricing page for your own product. Plans and prices live in lib/pricing.ts, the words in messages → pricing. */
export default async function PricingPage() {
  const t = await getTranslations("pricing")
  const format = await getFormats()

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <PricingPlans />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card title={t("compare.title")} description={t("compare.description")} className="xl:col-span-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("compare.feature")}</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.id} className="text-center">
                    {t(`plans.${plan.id}.name`)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="whitespace-normal">{t(`compare.rows.${row.key}`)}</TableCell>
                  {plans.map((plan) => {
                    const value = row.plans[plan.id]
                    return (
                      <TableCell key={plan.id} className="text-center tabular-nums">
                        {value === true ? (
                          <Check className="mx-auto size-4 text-success-text" aria-label={t("compare.included")} />
                        ) : value === false ? (
                          <Minus className="mx-auto size-4 text-muted-foreground" aria-label={t("compare.notIncluded")} />
                        ) : typeof value === "number" ? (
                          format.number(value)
                        ) : (
                          t(`compare.values.${value}`)
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card title={t("faq.title")} description={t("faq.description")} className="xl:col-span-2">
          <Accordion
            items={faqs.map((faq) => ({ value: faq, title: t(`faq.items.${faq}.question`), content: t(`faq.items.${faq}.answer`) }))}
            classNames={{ content: "text-muted-foreground" }}
          />
        </Card>
      </section>
    </>
  )
}
