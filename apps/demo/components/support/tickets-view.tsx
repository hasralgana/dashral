"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, CircleCheck, CircleDot, Clock, Mail, MessageCircle, Phone, Send, Siren, TimerOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { AlertDialog } from "@dashral/ui/components/alert-dialog"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Combobox } from "@dashral/ui/components/combobox"
import { createDataTableColumnHelper, DataTable, DataTableColumnHeader } from "@dashral/ui/components/data-table"
import { RadioGroup } from "@dashral/ui/components/radio-group"
import { Sheet } from "@dashral/ui/components/sheet"
import { Textarea } from "@dashral/ui/components/textarea"
import { toast } from "@dashral/ui/components/toast"

import { agents, tickets as sample, type Channel, type Priority, type Ticket, type TicketStatus } from "@/lib/support-data"

const helper = createDataTableColumnHelper<Ticket>()
const priorities: Priority[] = ["urgent", "high", "normal", "low"]
const statuses: TicketStatus[] = ["open", "pending", "solved"]
const channels: Channel[] = ["email", "chat", "phone"]
// Always icon + label, never color alone.
const priorityStyle = {
  urgent: { icon: Siren, color: "destructive" },
  high: { icon: ArrowUp, color: "warning" },
  normal: { icon: CircleDot, color: "info" },
  low: { icon: ArrowDown, color: "neutral" },
} as const
const statusStyle = {
  open: { icon: CircleDot, color: "info" },
  pending: { icon: Clock, color: "warning" },
  solved: { icon: CircleCheck, color: "success" },
} as const
const channelIcon = { email: Mail, chat: MessageCircle, phone: Phone }
// The sample data's "now", so "2 hours ago" reads the same on every visit.
const now = Date.parse("2026-10-19T10:30")

export function TicketsView() {
  const t = useTranslations("support")
  const [rows, setRows] = useState(sample)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = rows.find((row) => row.id === openId) ?? null
  const update = (id: string, change: Partial<Ticket>) => setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)))

  // Built once per language: DataTable renders each cell as a component, so new column functions on every render
  // would remount every cell (open menus, hover cards and focus would be lost) whenever the page's state changes.
  const columns = useMemo(() => {
    const agentName = (id: string | null) => agents.find((agent) => agent.id === id)?.name
    const ago = (iso: string) => {
      const minutes = Math.round((now - Date.parse(iso)) / 60_000)
      if (minutes < 60) return t("ago.minutes", { count: minutes })
      if (minutes < 60 * 24) return t("ago.hours", { count: Math.round(minutes / 60) })
      return t("ago.days", { count: Math.round(minutes / 60 / 24) })
    }
    return helper.columns([
      helper.accessor((row) => `${row.subject} ${row.customer} ${row.company} ${row.id}`, {
        id: "ticket",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.ticket")} />,
        cell: ({ row }) => (
          <div className="min-w-56">
            <button
              type="button"
              onClick={() => setOpenId(row.original.id)}
              className="rounded-sm text-start font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {row.original.subject}
            </button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="tabular-nums">{row.original.id}</span> · {row.original.customer}, {row.original.company}
              {row.original.breached && row.original.status !== "solved" && (
                <span className="inline-flex items-center gap-1 font-medium text-destructive-text">
                  · <TimerOff className="size-3" aria-hidden /> {t("table.breached")}
                </span>
              )}
            </p>
          </div>
        ),
        enableHiding: false,
      }),
      helper.accessor("priority", {
        header: t("table.priority"),
        cell: ({ getValue }) => {
          const { icon: Icon, color } = priorityStyle[getValue()]
          return (
            <Badge variant="soft" color={color}>
              <Icon aria-hidden />
              {t(`priorities.${getValue()}`)}
            </Badge>
          )
        },
        sortFn: (a, b) => priorities.indexOf(a.original.priority) - priorities.indexOf(b.original.priority),
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("status", {
        header: t("table.status"),
        cell: ({ getValue }) => {
          const { icon: Icon, color } = statusStyle[getValue()]
          return (
            <Badge variant="outline" color={color}>
              <Icon aria-hidden />
              {t(`statuses.${getValue()}`)}
            </Badge>
          )
        },
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("assignee", {
        header: t("table.assignee"),
        cell: ({ getValue }) => {
          const name = agentName(getValue())
          return name ? (
            <span className="flex items-center gap-2 text-sm whitespace-nowrap">
              <Avatar name={name} alt="" size="xs" />
              {name.split(" ")[0]}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">{t("table.unassigned")}</span>
          )
        },
        enableGlobalFilter: false,
      }),
      helper.accessor("channel", {
        header: t("table.channel"),
        cell: ({ getValue }) => {
          const Icon = channelIcon[getValue()]
          return (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon className="size-3.5" aria-hidden /> {t(`channels.${getValue()}`)}
            </span>
          )
        },
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("updated", {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.updated")} />,
        cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{ago(getValue())}</span>,
        enableGlobalFilter: false,
      }),
    ])
  }, [t])

  return (
    <>
      <Card
        title={t("table.title")}
        description={t("table.description", { open: rows.filter((row) => row.status === "open").length, unassigned: rows.filter((row) => !row.assignee && row.status !== "solved").length })}
        classNames={{ body: "pt-0" }}
      >
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          searchPlaceholder={t("table.search")}
          filters={[
            { column: "status", title: t("table.status"), options: statuses.map((value) => ({ value, label: t(`statuses.${value}`) })) },
            { column: "priority", title: t("table.priority"), options: priorities.map((value) => ({ value, label: t(`priorities.${value}`) })) },
            { column: "channel", title: t("table.channel"), options: channels.map((value) => ({ value, label: t(`channels.${value}`) })) },
          ]}
          exportable={{ filename: "tickets", columns: { ticket: { label: t("table.ticket"), value: (row) => row.subject } } }}
          emptyMessage={t("table.empty")}
          autoResetPage={false}
        />
      </Card>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => !next && setOpenId(null)}
        title={open?.subject ?? ""}
        description={open ? `${open.id} · ${open.customer}, ${open.company}` : undefined}
        className="w-full sm:max-w-lg"
        classNames={{ body: "space-y-5 p-4", footer: "border-t" }}
        footer={
          open && open.status !== "solved" ? (
            <AlertDialog
              trigger={
                <Button className="w-full">
                  <CircleCheck /> {t("details.solve")}
                </Button>
              }
              title={t("details.solveTitle")}
              description={t("details.solveDescription", { customer: open.customer })}
              confirmLabel={t("details.solve")}
              onConfirm={() => {
                update(open.id, { status: "solved" })
                toast.success(t("details.solved", { id: open.id }))
                setOpenId(null)
              }}
            />
          ) : undefined
        }
      >
        {open && <TicketDetails key={open.id} ticket={open} onChange={(change) => update(open.id, change)} />}
      </Sheet>
    </>
  )
}

function TicketDetails({ ticket, onChange }: { ticket: Ticket; onChange: (change: Partial<Ticket>) => void }) {
  const t = useTranslations("support")
  const [reply, setReply] = useState("")
  const [sent, setSent] = useState<string[]>([])
  const agent = agents.find((candidate) => candidate.id === ticket.assignee)

  function send() {
    if (!reply.trim()) return
    setSent((current) => [...current, reply.trim()])
    setReply("")
    if (ticket.status === "open") onChange({ status: "pending" })
    toast.success(t("details.sent", { customer: ticket.customer }))
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar name={ticket.customer} alt="" size="sm" />
          <div className="min-w-0 rounded-lg rounded-ss-sm bg-muted px-3 py-2 text-sm">{ticket.message}</div>
        </div>
        {sent.map((text, i) => (
          <div key={i} className="flex flex-row-reverse gap-3">
            <Avatar name={agent?.name ?? "You"} alt="" size="sm" />
            <div className="min-w-0 rounded-lg rounded-se-sm bg-primary px-3 py-2 text-sm text-primary-foreground">{text}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
        className="space-y-2"
      >
        <Textarea
          label={t("details.reply")}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              send()
            }
          }}
          placeholder={t("details.replyPlaceholder", { name: ticket.customer.split(" ")[0] ?? "" })}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="outline" disabled={!reply.trim()}>
            <Send /> {t("details.send")}
          </Button>
        </div>
      </form>

      <Combobox
        label={t("table.assignee")}
        placeholder={t("table.unassigned")}
        value={ticket.assignee ?? ""}
        onValueChange={(value) => {
          onChange({ assignee: value || null })
          const name = agents.find((candidate) => candidate.id === value)?.name
          if (name) toast(t("details.assigned", { name }))
        }}
        options={agents.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
      />

      <RadioGroup
        label={t("table.priority")}
        value={ticket.priority}
        onValueChange={(value) => onChange({ priority: value as Priority })}
        options={priorities.map((value) => ({ value, label: t(`priorities.${value}`), description: t(`priorityHints.${value}`) }))}
        className="grid grid-cols-2 gap-3"
      />
    </>
  )
}
