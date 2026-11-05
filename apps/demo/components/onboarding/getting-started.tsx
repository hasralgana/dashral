"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, LifeBuoy, PartyPopper } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { Progress } from "@dashral/ui/components/progress"
import { Steps } from "@dashral/ui/components/steps"
import { cn } from "@dashral/ui/lib/utils"

import { dashral } from "@/lib/site"

// The steps to a working setup, grouped in phases. Each one links to the page where it's done.
const phases = [
  { id: "account", tasks: [{ id: "profile", href: "/settings" }, { id: "security", href: "/two-factor" }] },
  { id: "workspace", tasks: [{ id: "finance", href: "/finance" }, { id: "project", href: "/projects" }] },
  { id: "operations", tasks: [{ id: "tickets", href: "/support" }, { id: "stock", href: "/inventory" }] },
] as const
type TaskId = (typeof phases)[number]["tasks"][number]["id"]
const allTasks: { id: TaskId; href: string }[] = phases.flatMap((phase) => [...phase.tasks])

export function GettingStarted() {
  const t = useTranslations("onboarding")
  const [done, setDone] = useState<TaskId[]>(["profile"])
  const toggle = (id: TaskId, on: boolean) => setDone((current) => (on ? [...current, id] : current.filter((task) => task !== id)))
  const phaseDone = (index: number) => phases[index]!.tasks.every((task) => done.includes(task.id))
  const current = phases.findIndex((_, index) => !phaseDone(index))
  const finished = current === -1
  const percent = Math.round((done.length / allTasks.length) * 100)

  return (
    <>
      <Card classNames={{ body: "py-6" }}>
        <Steps
          items={phases.map((phase) => ({ title: t(`phases.${phase.id}.title`), description: t(`phases.${phase.id}.description`) }))}
          current={finished ? phases.length : current}
        />
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {phases.map((phase, index) => (
            <Card
              key={phase.id}
              title={t(`phases.${phase.id}.title`)}
              description={t("phaseCount", { done: phase.tasks.filter((task) => done.includes(task.id)).length, total: phase.tasks.length })}
              classNames={{ body: "p-0" }}
              className={cn(index === current && "ring-2 ring-primary/30")}
            >
              <ul className="divide-y divide-divider">
                {phase.tasks.map((task) => {
                  const checked = done.includes(task.id)
                  return (
                    <li key={task.id} className="flex items-start gap-3 px-6 py-4">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={checked}
                        onCheckedChange={(value) => toggle(task.id, value === true)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`task-${task.id}`} className={cn("font-medium", checked && "text-muted-foreground line-through")}>
                          {t(`tasks.${task.id}.title`)}
                        </label>
                        <p className="text-sm text-muted-foreground">{t(`tasks.${task.id}.description`)}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link href={task.href}>
                          {t(`tasks.${task.id}.action`)} <ArrowRight className="rtl:-scale-x-100" />
                        </Link>
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card title={t("progress.title")} classNames={{ body: "space-y-3" }}>
            {finished ? (
              <div className="flex items-center gap-3">
                <PartyPopper className="size-8 text-primary-text" aria-hidden />
                <div>
                  <p className="font-medium">{t("progress.finishedTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("progress.finished")}</p>
                </div>
              </div>
            ) : (
              <p className="text-3xl font-semibold tabular-nums">{percent}%</p>
            )}
            <Progress value={percent} color={finished ? "success" : "primary"} aria-label={t("progress.title")} />
            <p className="text-sm text-muted-foreground">{t("progress.count", { done: done.length, total: allTasks.length })}</p>
          </Card>
          <Card title={t("help.title")} description={t("help.description")} classNames={{ body: "space-y-2" }}>
            {dashral.show && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={dashral.links.docs} target="_blank" rel="noreferrer">
                  <BookOpen /> {t("help.docs")}
                </a>
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/support">
                <LifeBuoy /> {t("help.support")}
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </>
  )
}
