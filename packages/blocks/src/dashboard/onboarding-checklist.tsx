"use client"

import { useId, useState } from "react"
import { Check, ChevronDown, PartyPopper, X } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Progress } from "@dashral/ui/components/progress"
import { cn } from "@dashral/ui/lib/utils"

// The products named here are real ones, as examples: their names are their owners' trademarks, no affiliation implied. Put in the tools your product really works with.
const brands = { payments: "Stripe", store: "Shopify", chat: "Slack" }

/** A step: what it is, its action's label (and where it goes, or onAction hears it), and about how long it takes. */
export type Task = { id: string; title: string; text: string; action: string; href?: string; minutes: number }

const sampleTasks: Task[] = [
  { id: "account", title: "Create your workspace", text: "Name it and pick your time zone, so every report starts its day when yours does.", action: "Open settings", minutes: 1 },
  { id: "source", title: "Connect a data source", text: `${brands.payments}, ${brands.store} or Postgres. We backfill the last 12 months, so your charts aren't empty.`, action: `Connect ${brands.payments}`, minutes: 2 },
  { id: "dashboard", title: "Build your first dashboard", text: "Start from a template or drag charts onto a blank board. You can change everything later.", action: "Choose a template", minutes: 5 },
  { id: "team", title: "Invite your team", text: "Teammates see the same numbers and can comment on any chart. Viewers are always free.", action: "Invite people", minutes: 1 },
  { id: "alert", title: "Set up an alert", text: `Get one message when a number moves, in email or ${brands.chat}, instead of checking all day.`, action: "Create an alert", minutes: 2 },
]

/**
 * A getting-started card: the steps to a working setup, with progress. Tick a step, or do it from its action;
 * the next open step unfolds. Finishing them all shows a small celebration, and the card can be hidden and
 * brought back. Every part comes from props: your steps, which are done (controllable), and handlers for each step's
 * action and for hiding the card.
 */
export function OnboardingChecklist({
  title = "Get started with Acme",
  tasks = sampleTasks,
  done: doneProp,
  onDoneChange,
  onAction,
  hidden: hiddenProp,
  onHiddenChange,
  finished: finishedText = { title: "You're all set", description: "Your workspace is ready. Here's to fewer spreadsheets.", note: "Five steps, done. Your first weekly report goes out on Monday at 9 AM." },
  hiddenNote = "Getting started is hidden. It's in Help whenever you want it.",
}: {
  title?: React.ReactNode
  tasks?: Task[]
  /** The steps done, by id (the card keeps them without it). */
  done?: string[]
  onDoneChange?: (done: string[]) => void
  /** A step's action button: go do it. Without it (and without an href), the button marks the step done. */
  onAction?: (task: Task) => void
  hidden?: boolean
  onHiddenChange?: (hidden: boolean) => void
  finished?: { title: string; description: string; note?: string }
  hiddenNote?: string
}) {
  const [ownDone, setOwnDone] = useState<string[]>(["account"])
  const done = doneProp ?? ownDone
  const setDone = (next: string[]) => {
    setOwnDone(next)
    onDoneChange?.(next)
  }
  const [open, setOpen] = useState<string | null>(() => tasks.find((task) => !done.includes(task.id))?.id ?? null)
  const [ownHidden, setOwnHidden] = useState(false)
  const hidden = hiddenProp ?? ownHidden
  const setHidden = (next: boolean) => {
    setOwnHidden(next)
    onHiddenChange?.(next)
  }
  const id = useId()

  const count = tasks.filter((task) => done.includes(task.id)).length
  const finished = count === tasks.length
  const minutesLeft = tasks.filter((task) => !done.includes(task.id)).reduce((sum, task) => sum + task.minutes, 0)

  function toggle(taskId: string) {
    const next = done.includes(taskId) ? done.filter((d) => d !== taskId) : [...done, taskId]
    setDone(next)
    // Ticking a step moves you on to the next one still open.
    if (!done.includes(taskId)) setOpen(tasks.find((task) => !next.includes(task.id))?.id ?? null)
  }

  if (hidden)
    return (
      <section className="bg-background p-4 sm:p-6">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <span>{hiddenNote}</span>
          <Button size="sm" variant="ghost" onClick={() => setHidden(false)}>
            Show again
          </Button>
        </div>
      </section>
    )

  return (
    <section aria-labelledby={`${id}-title`} className="bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-xl overflow-hidden rounded-xl border bg-card">
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div>
            <h2 id={`${id}-title`} className="font-semibold">
              {finished ? finishedText.title : title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {finished ? finishedText.description : `${count} of ${tasks.length} done · about ${minutesLeft} minutes left`}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Hide getting started" className="-me-1.5 -mt-1" onClick={() => setHidden(true)}>
            <X />
          </Button>
        </div>
        <Progress value={(count / tasks.length) * 100} color={finished ? "success" : "primary"} className="mx-5 h-1.5 w-auto" aria-label={`${count} of ${tasks.length} steps done`} />

        {finished ? (
          <div className="grid justify-items-center gap-3 px-5 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success/15 text-success-text animate-in zoom-in-75 fade-in-0 duration-(--duration-considered) ease-enter motion-reduce:animate-none">
              <PartyPopper className="size-6" aria-hidden />
            </span>
            {finishedText.note && <p className="max-w-xs text-sm text-muted-foreground">{finishedText.note}</p>}
            <Button size="sm" variant="outline" onClick={() => setHidden(true)}>
              Hide this card
            </Button>
          </div>
        ) : (
          <ol className="mt-3 border-t">
            {tasks.map((task, i) => {
              const isDone = done.includes(task.id)
              const isOpen = open === task.id
              return (
                <li key={task.id} className="border-b last:border-b-0">
                  <div className="flex items-center gap-3 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(task.id)}
                      aria-label={isDone ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                      aria-pressed={isDone}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition-[background-color,border-color] duration-(--duration-fast) outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        isDone ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 border-dashed hover:border-primary"
                      )}
                    >
                      <Check className={cn("size-3 transition-[opacity,scale] duration-(--duration-fast)", isDone ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={3} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : task.id)}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-${task.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span className={cn("flex-1 font-medium transition-colors", isDone && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                        <span className="sr-only">Step {i + 1}: </span>
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{task.minutes} min</span>
                      <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-considered) ease-standard", isOpen && "rotate-180")} aria-hidden />
                    </button>
                  </div>
                  {/* Unfolds by its own height: the row's track grows from 0fr to 1fr. */}
                  <div
                    id={`${id}-${task.id}`}
                    className={cn("grid transition-[grid-template-rows] duration-(--duration-considered) ease-standard", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                    inert={!isOpen}
                  >
                    <div className="overflow-hidden">
                      <div className="ps-13 pe-5 pb-4">
                        <p className="text-sm text-muted-foreground">{task.text}</p>
                        <div className="mt-3 flex gap-2">
                          {isDone ? (
                            <Button size="sm" variant="outline" onClick={() => toggle(task.id)}>
                              Mark as not done
                            </Button>
                          ) : (
                            <>
                              {task.href ? (
                                <Button size="sm" asChild>
                                  <a href={task.href}>{task.action}</a>
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => (onAction ? onAction(task) : toggle(task.id))}>
                                  {task.action}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => toggle(task.id)}>
                                Skip
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
