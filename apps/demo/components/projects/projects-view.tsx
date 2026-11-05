"use client"

import { useMemo, useRef, useState } from "react"
import { Archive, CircleCheck, CircleX, Copy, ExternalLink, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Card } from "@dashral/ui/components/card"
import { ContextMenu } from "@dashral/ui/components/context-menu"
import { createDataTableColumnHelper, DataTable, DataTableColumnHeader } from "@dashral/ui/components/data-table"
import { HoverCard } from "@dashral/ui/components/hover-card"
import { MultiSelect } from "@dashral/ui/components/multi-select"
import { Progress } from "@dashral/ui/components/progress"
import { Sheet } from "@dashral/ui/components/sheet"
import { Steps } from "@dashral/ui/components/steps"
import { toast } from "@dashral/ui/components/toast"
import { cn } from "@dashral/ui/lib/utils"

import { NewProjectSheet } from "@/components/projects/new-project-sheet"
import { labels, personById, projects as sample, projectsToday, stages, type Health, type Project } from "@/lib/projects-data"
import { formats } from "@/lib/format"
import { localeInfo, moneyLocale } from "@/lib/i18n"
import { useFormats } from "@/lib/use-formats"

const helper = createDataTableColumnHelper<Project>()
// Health is always icon + label, never color alone.
const healthStyle = {
  onTrack: { icon: CircleCheck, color: "success" },
  atRisk: { icon: TriangleAlert, color: "warning" },
  offTrack: { icon: CircleX, color: "destructive" },
  done: { icon: CircleCheck, color: "neutral" },
} as const
const healths: Health[] = ["onTrack", "atRisk", "offTrack", "done"]

export function ProjectsView() {
  const t = useTranslations("projects")
  const locale = useLocale()
  const [rows, setRows] = useState<Project[]>(sample)
  // The next project number: counted up, never from the row count, so an archived project's number isn't reused.
  const nextId = useRef(240 + sample.length)
  const newId = () => `PRJ-${nextId.current++}`
  const [labelFilter, setLabelFilter] = useState<string[]>([])
  const [open, setOpen] = useState<Project | null>(null)
  const shown = labelFilter.length ? rows.filter((row) => row.labels.some((label) => labelFilter.includes(label))) : rows

  // Built once per language: DataTable renders each cell as a component, so new column functions on every render
  // would remount every cell (open menus, hover cards and focus would be lost) whenever the page's state changes.
  const columns = useMemo(() => {
    const format = formats(localeInfo[locale].intl, moneyLocale(locale))
    return helper.columns([
      // The name and client together, so the search finds either. Right-click the name for its menu.
      helper.accessor((row) => `${row.name} ${row.client} ${row.id}`, {
        id: "project",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.project")} />,
        cell: ({ row }) => (
          <ContextMenu
            items={[
              { label: t("menu.open"), icon: <ExternalLink />, onSelect: () => setOpen(row.original) },
              {
                label: t("menu.duplicate"),
                icon: <Copy />,
                onSelect: () => {
                  const copy = { ...row.original, id: newId(), name: t("menu.copyOf", { name: row.original.name }), progress: 0, stage: "brief" as const, health: "onTrack" as const }
                  setRows((current) => [copy, ...current])
                  toast.success(t("menu.duplicated", { name: row.original.name }))
                },
              },
              { type: "separator" },
              {
                label: t("menu.archive"),
                icon: <Archive />,
                color: "destructive",
                onSelect: () => {
                  setRows((current) => current.filter((item) => item.id !== row.original.id))
                  toast(t("menu.archived", { name: row.original.name }))
                },
              },
            ]}
          >
            <div className="min-w-48">
              <button
                type="button"
                onClick={() => setOpen(row.original)}
                className="rounded-sm text-start font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {row.original.name}
              </button>
              <p className="text-xs text-muted-foreground">
                {row.original.client} · <span className="tabular-nums">{row.original.id}</span>
              </p>
            </div>
          </ContextMenu>
        ),
        enableHiding: false,
      }),
      helper.accessor("stage", {
        header: t("table.stage"),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-sm">
            {t(`stages.${getValue()}`)}
            <span className="ms-1.5 text-xs text-muted-foreground tabular-nums">
              {stages.indexOf(getValue()) + 1}/{stages.length}
            </span>
          </span>
        ),
        enableGlobalFilter: false,
      }),
      helper.accessor("health", {
        header: t("table.health"),
        cell: ({ getValue }) => {
          const { icon: Icon, color } = healthStyle[getValue()]
          return (
            <Badge variant="soft" color={color}>
              <Icon aria-hidden />
              {t(`health.${getValue()}`)}
            </Badge>
          )
        },
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("progress", {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.progress")} />,
        cell: ({ getValue, row }) => (
          <div className="flex min-w-32 items-center gap-2">
            <Progress value={getValue()} color={row.original.health === "done" ? "success" : "primary"} className="h-1.5" aria-label={t("table.progressOf", { name: row.original.name })} />
            <span className="w-9 text-end text-xs text-muted-foreground tabular-nums">{format.number(getValue())}%</span>
          </div>
        ),
        enableGlobalFilter: false,
      }),
      helper.accessor("owner", {
        header: t("table.owner"),
        cell: ({ getValue }) => <Owner id={getValue()} />,
        enableGlobalFilter: false,
      }),
      helper.accessor("due", {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.due")} />,
        cell: ({ getValue, row }) => {
          const late = row.original.health !== "done" && getValue() < projectsToday
          return (
            <span className={cn("whitespace-nowrap tabular-nums", late ? "font-medium text-destructive-text" : "text-muted-foreground")}>
              {format.date(getValue())}
              {late && <span className="sr-only"> ({t("table.overdue")})</span>}
            </span>
          )
        },
        enableGlobalFilter: false,
      }),
      helper.accessor((row) => row.labels.join(" "), {
        id: "labels",
        header: t("table.labels"),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.labels.map((label) => (
              <Badge key={label} variant="outline">
                {t(`labels.${label}`)}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
      }),
    ])
  }, [t, locale])

  return (
    <>
      <Card
        title={t("table.title")}
        description={t("table.description")}
        action={<NewProjectSheet onCreate={(project) => setRows((current) => [{ ...project, id: newId() }, ...current])} />}
        classNames={{ body: "pt-0" }}
      >
        <DataTable
          columns={columns}
          data={shown}
          getRowId={(row) => row.id}
          searchPlaceholder={t("table.search")}
          filters={[{ column: "health", title: t("table.health"), options: healths.map((value) => ({ value, label: t(`health.${value}`) })) }]}
          toolbar={() => (
            <MultiSelect
              aria-label={t("table.labels")}
              placeholder={t("table.allLabels")}
              value={labelFilter}
              onValueChange={setLabelFilter}
              options={labels.map((value) => ({ value, label: t(`labels.${value}`) }))}
              maxShown={2}
              className="h-8 w-auto min-w-40"
            />
          )}
          exportable={{ filename: "projects", columns: { project: { label: t("table.project"), value: (row) => row.name } } }}
          emptyMessage={t("table.empty")}
          autoResetPage={false}
        />
      </Card>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
        title={open?.name ?? ""}
        description={open ? `${open.client} · ${open.id}` : undefined}
        className="w-full sm:max-w-md"
        classNames={{ body: "space-y-5 p-4" }}
      >
        {open && <ProjectDetails project={open} />}
      </Sheet>
    </>
  )
}

/** The owner's avatar and name; hover for who they are. */
function Owner({ id }: { id: string }) {
  const t = useTranslations("projects")
  const person = personById(id)
  return (
    <HoverCard
      trigger={
        <button type="button" className="flex items-center gap-2 rounded-md text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <Avatar name={person.name} alt="" size="sm" />
          {person.name.split(" ")[0]}
        </button>
      }
      className="w-64"
    >
      <div className="flex gap-3">
        <Avatar name={person.name} alt="" size="lg" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{person.name}</p>
          <p className="text-xs text-muted-foreground">{t(`roles.${person.role}`)}</p>
          <p className="truncate text-xs text-muted-foreground">{person.email}</p>
          <p className="pt-1 text-xs">{t("owner.leads", { count: person.projects })}</p>
        </div>
      </div>
    </HoverCard>
  )
}

function ProjectDetails({ project }: { project: Project }) {
  const t = useTranslations("projects")
  const format = useFormats()
  const owner = personById(project.owner)
  const { icon: Icon, color } = healthStyle[project.health]
  const facts = [
    { label: t("table.owner"), value: owner.name },
    { label: t("table.due"), value: format.date(project.due) },
    { label: t("details.budget"), value: format.currency(project.budget) },
    { label: t("table.progress"), value: `${format.number(project.progress)}%` },
  ]
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="soft" color={color}>
          <Icon aria-hidden />
          {t(`health.${project.health}`)}
        </Badge>
        {project.labels.map((label) => (
          <Badge key={label} variant="outline">
            {t(`labels.${label}`)}
          </Badge>
        ))}
      </div>
      <Card variant="inset" classNames={{ body: "p-0" }}>
        <dl className="divide-y divide-divider text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="text-end font-medium tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t("details.stages")}</h3>
        <Steps
          orientation="vertical"
          items={stages.map((stage) => ({ title: t(`stages.${stage}`), description: t(`stageHints.${stage}`) }))}
          current={project.health === "done" ? stages.length : stages.indexOf(project.stage)}
        />
      </div>
    </>
  )
}
