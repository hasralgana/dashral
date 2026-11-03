"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, MessageSquarePlus, Receipt, Sparkles, TrendingUp, UsersRound } from "lucide-react"
import { ApprovalCard } from "@dashral/ui/components/approval-card"
import { Button } from "@dashral/ui/components/button"
import { Conversation } from "@dashral/ui/components/conversation"
import { Message } from "@dashral/ui/components/message"
import { PromptComposer, type PromptStatus } from "@dashral/ui/components/prompt-composer"
import { PromptSuggestions } from "@dashral/ui/components/prompt-suggestions"
import { Reasoning } from "@dashral/ui/components/reasoning"
import { Select } from "@dashral/ui/components/select"
import { ToolActivity, type ToolStep } from "@dashral/ui/components/tool-activity"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { cn } from "@dashral/ui/lib/utils"

// An assistant for a dashboard. Without `onAsk` it plays scripted answers, so it works without a model. With it, your
// model drives the same turn: call run.think, run.tool, run.approve and run.write as your stream (the Vercel AI SDK's
// streamText, say) brings reasoning, tool calls and text:
//
//   <AiAssistant
//     onAsk={async (prompt, run) => {
//       const result = streamText({ model, prompt, tools, abortSignal: run.signal })
//       for await (const part of result.fullStream) {
//         if (part.type === "reasoning-delta") run.think(part.text)
//         if (part.type === "text-delta") run.write(part.text)
//         if (part.type === "tool-call") calls[part.toolCallId] = run.tool(part.toolName, part.input)
//         if (part.type === "tool-result") calls[part.toolCallId]?.done(part.output)
//       }
//     }}
//   />

/** What an action needs approved before it runs, on the approval card. */
export type ApprovalRequest = { title: string; description?: string; details?: { label: string; value: string }[]; approveLabel?: string; result?: string }
/** One answer in the making, for your model's stream to fill in. */
export type AssistantRun = {
  /** Adds to the reasoning shown above the answer (folded away once the answer starts). */
  think: (text: string) => void
  /** Shows a tool call running; call done or fail on what it returns when it finishes. */
  tool: (name: string, input?: unknown) => { done: (output?: unknown, description?: string) => void; fail: (description?: string) => void }
  /** Shows the approval card and waits: true once approved, false when denied. */
  approve: (request: ApprovalRequest) => Promise<boolean>
  /** Adds to the answer, as it streams in. */
  write: (text: string) => void
  /** Aborted when Stop is pressed or a new conversation starts: pass it to your model's call. */
  signal: AbortSignal
}
export type AssistantSuggestion = { icon?: React.ReactNode; label: string; description?: string; prompt: string }

type Tool = { name: string; input?: unknown; output?: unknown; description: string; ms: number }
type Script = {
  thoughts?: string[]
  tools?: Tool[]
  /** Asks before acting; what runs and what it says after each choice. */
  approval?: {
    title: string
    description: string
    details: { label: string; value: string }[]
    approveLabel: string
    result: string
    then: Tool
    approved: string
    denied: string
  }
  answer: string
}

const scripts: Record<string, Script> = {
  revenue: {
    thoughts: [
      "This month means October so far. I need paid orders and their total, then the same for September to compare.",
      "Revenue is $48,920 against $43,480: up 12.5%. I'll check which plan drove it.",
    ],
    tools: [
      { name: "Search orders", input: { from: "2026-10-01", to: "2026-10-31", status: "paid" }, output: { orders: 1284, revenue: 48920 }, description: "1,284 paid orders, $48,920", ms: 900 },
      { name: "Compare with September", input: { metric: "revenue", groupBy: "plan" }, output: { change: "+12.5%", topPlan: "Team" }, description: "Up 12.5%, led by the Team plan", ms: 800 },
    ],
    answer:
      "October has brought in $48,920 so far, 12.5% more than September, from 1,284 orders. Most of the rise came from the Team plan: 31 new subscriptions against 19 last month. Refunds stayed low at 1.8%.",
  },
  unpaid: {
    tools: [{ name: "Find unpaid invoices", input: { status: "past_due" }, output: { invoices: 3, total: 2520 }, description: "3 invoices past due, $2,520 in all", ms: 800 }],
    approval: {
      title: "Send 3 payment reminders",
      description: "Each customer gets the friendly first reminder, with their invoice attached.",
      details: [
        { label: "To", value: "Northwind, Sagara Resorts, Kopi Senja" },
        { label: "Total due", value: "$2,520" },
      ],
      approveLabel: "Send reminders",
      result: "Reminders sent",
      then: { name: "Send 3 reminders", description: "Delivered to all three", ms: 1100 },
      approved: "Done: the three reminders went out. I'll tell you when any of them pays.",
      denied: "OK, I won't send them. The invoices stay open in Billing if you change your mind.",
    },
    answer: "",
  },
  traffic: {
    thoughts: ["Tuesday is October 14. I'll compare its visits by source with the Tuesdays before it."],
    tools: [{ name: "Read traffic by source", input: { day: "2026-10-14" }, output: { email: "-61%", search: "+2%", direct: "-1%" }, description: "Email visits fell 61%; the rest held", ms: 900 }],
    answer:
      "Traffic dipped on Tuesday because the newsletter went out a day late: visits from email fell 61% that day, while search and direct held steady. Sign-ups recovered on Wednesday, and the week ended 4% up.",
  },
  other: {
    thoughts: ["This demo has sample answers for three questions; anything else gets a word on how it works."],
    answer:
      "This is a demo with sample data, so I can answer three questions: revenue this month, unpaid invoices and Tuesday's traffic dip. In your app, connect a model and give it your dashboards as tools, and I'll answer anything about them.",
  },
}

const sampleSuggestions: AssistantSuggestion[] = [
  { icon: <TrendingUp />, label: "Revenue this month", description: "Totals, the change and what drove it", prompt: "How's revenue this month?" },
  { icon: <Receipt />, label: "Unpaid invoices", description: "Remind the customers who owe you", prompt: "Remind the customers who haven't paid yet." },
  { icon: <Globe />, label: "Tuesday's traffic dip", description: "What happened, and whether it recovered", prompt: "Why did traffic dip on Tuesday?" },
  { icon: <UsersRound />, label: "Best customers", description: "This quarter's top accounts", prompt: "Who are our biggest customers this quarter?" },
]

const sampleHistory = [
  { title: "October revenue", prompt: "How's revenue this month?" },
  { title: "Payment reminders", prompt: "Remind the customers who haven't paid yet." },
  { title: "Tuesday's traffic dip", prompt: "Why did traffic dip on Tuesday?" },
]

const scriptFor = (prompt: string) =>
  /revenue|sales/i.test(prompt) ? scripts.revenue! : /paid|invoice|remind/i.test(prompt) ? scripts.unpaid! : /traffic|visit/i.test(prompt) ? scripts.traffic! : scripts.other!

type Turn =
  | { id: number; from: "user"; text: string }
  | {
      id: number
      from: "assistant"
      prompt: string
      thoughts?: { text: string; done: boolean }
      tools: ToolStep[]
      /** What ran after the approval, shown under it. */
      after: ToolStep[]
      approval?: { request: ApprovalRequest; asking: boolean; done: boolean; stopped?: boolean }
      /** Your model's call threw: what it said. */
      error?: string
      answer: string
      streaming: boolean
    }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export type AiAssistantProps = {
  title?: string
  description?: string
  /** The empty conversation's words, and the cards that start one. */
  empty?: { title: string; description: string }
  suggestions?: AssistantSuggestion[]
  /** Past conversations beside it on wide screens; none hides the column. */
  history?: { title: string; prompt: string }[]
  /** The models to pick from, in the header; none hides the picker. */
  models?: { value: string; label: string; description?: string }[]
  /** The Search toggle in the composer. */
  webSearch?: boolean
  placeholder?: string
  /** Your model: fill the turn as its stream comes in (see AssistantRun). Throw to show an error on the answer. Without it, scripted sample answers. */
  onAsk?: (prompt: string, run: AssistantRun, options: { model?: string; web: boolean; files: File[] }) => Promise<void> | void
  /** Good or bad response on an answer. */
  onFeedback?: (answer: { prompt: string; text: string }, feedback: "up" | "down" | null) => void
}

export function AiAssistant({
  title = "Assistant",
  description = "Answers from your sales, customers and traffic",
  empty = { title: "What would you like to know?", description: "Ask about revenue, invoices, customers or traffic. The answers come from your dashboards." },
  suggestions = sampleSuggestions,
  history = sampleHistory,
  models = [
    { value: "fast", label: "Fast", description: "Quick answers" },
    { value: "deep", label: "Deep", description: "Slower, for analysis" },
  ],
  webSearch = true,
  placeholder = "Ask about revenue, invoices or traffic…",
  onAsk,
  onFeedback,
}: AiAssistantProps) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [status, setStatus] = useState<PromptStatus>("ready")
  const [model, setModel] = useState(models[0]?.value)
  const [web, setWeb] = useState(false)
  const run = useRef(0)
  const nextId = useRef(1)
  const decide = useRef<((choice: "approve" | "deny") => void) | null>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      run.current++
      abort.current?.abort()
    },
    []
  )

  /** Asks: your model through onAsk, or the scripted sample. */
  function ask(prompt: string, files: File[] = []) {
    if (onAsk) void askModel(prompt, files)
    else void play(prompt)
  }

  async function askModel(prompt: string, files: File[]) {
    const current = ++run.current
    const alive = () => run.current === current
    const controller = new AbortController()
    abort.current = controller
    const question = nextId.current++
    const id = nextId.current++
    const patch = (change: (turn: Extract<Turn, { from: "assistant" }>) => Partial<Extract<Turn, { from: "assistant" }>>) =>
      alive() && setTurns((all) => all.map((turn) => (turn.id === id && turn.from === "assistant" ? { ...turn, ...change(turn) } : turn)))
    setTurns((all) => [...all, { id: question, from: "user", text: prompt }, { id, from: "assistant", prompt, tools: [], after: [], answer: "", streaming: false }])
    setStatus("submitted")
    // Tool calls before the approval show above it, the ones after it under it.
    let list: "tools" | "after" = "tools"
    const handle: AssistantRun = {
      signal: controller.signal,
      think: (text) => patch((turn) => ({ thoughts: { text: (turn.thoughts?.text ?? "") + text, done: false } })),
      tool(name, input) {
        const where = list
        const started = performance.now()
        let index = -1
        patch((turn) => {
          index = turn[where].length
          return { [where]: [...turn[where], { name, status: "running", input }] }
        })
        const finish = (step: Partial<ToolStep>) =>
          patch((turn) => ({ [where]: turn[where].map((s, i) => (i === index ? { ...s, ...step, duration: Math.round(performance.now() - started) } : s)) }))
        return {
          done: (output, description) => finish({ status: "done", output, description }),
          fail: (description) => finish({ status: "error", description }),
        }
      },
      async approve(request) {
        patch(() => ({ approval: { request, asking: true, done: false } }))
        setStatus("ready")
        const choice = await new Promise<"approve" | "deny">((resolve) => (decide.current = resolve))
        decide.current = null
        list = "after"
        if (alive()) setStatus("streaming")
        if (choice === "approve") patch((turn) => ({ approval: turn.approval && { ...turn.approval, asking: false, done: true } }))
        return choice === "approve"
      },
      write(text) {
        if (!alive()) return
        setStatus("streaming")
        patch((turn) => ({ answer: turn.answer + text, streaming: true, thoughts: turn.thoughts && { ...turn.thoughts, done: true } }))
      },
    }
    try {
      await onAsk!(prompt, handle, { model, web, files })
      patch((turn) => ({ streaming: false, thoughts: turn.thoughts && { ...turn.thoughts, done: true } }))
    } catch (e) {
      if (!controller.signal.aborted) patch((turn) => ({ streaming: false, error: e instanceof Error ? e.message : "Couldn't finish this answer.", thoughts: turn.thoughts && { ...turn.thoughts, done: true } }))
    }
    if (alive()) setStatus("ready")
  }

  async function play(prompt: string) {
    const current = ++run.current
    const alive = () => run.current === current
    const script = scriptFor(prompt)
    const question = nextId.current++
    const id = nextId.current++
    const patch = (change: (turn: Extract<Turn, { from: "assistant" }>) => Partial<Extract<Turn, { from: "assistant" }>>) =>
      setTurns((all) => all.map((turn) => (turn.id === id && turn.from === "assistant" ? { ...turn, ...change(turn) } : turn)))
    setTurns((all) => [
      ...all,
      { id: question, from: "user", text: prompt },
      { id, from: "assistant", prompt, thoughts: script.thoughts && { text: "", done: false }, tools: [], after: [], answer: "", streaming: false },
    ])
    setStatus("submitted")

    for (const thought of script.thoughts ?? []) {
      await sleep(900)
      if (!alive()) return
      patch((turn) => ({ thoughts: { text: turn.thoughts!.text ? `${turn.thoughts!.text}\n\n${thought}` : thought, done: false } }))
    }
    if (script.thoughts) patch((turn) => ({ thoughts: { ...turn.thoughts!, done: true } }))

    // A tool call: running, then done with what it found. `list` is where it shows: before the approval, or after it.
    async function runTool(tool: Tool, list: "tools" | "after" = "tools") {
      patch((turn) => ({ [list]: [...turn[list], { name: tool.name, status: "running", input: tool.input }] }))
      await sleep(tool.ms)
      if (!alive()) return false
      patch((turn) => ({
        [list]: turn[list].map((step, i) => (i === turn[list].length - 1 ? { ...step, status: "done", output: tool.output, description: tool.description, duration: tool.ms } : step)),
      }))
      return true
    }
    for (const tool of script.tools ?? []) if (!(await runTool(tool))) return

    let answer = script.answer
    if (script.approval) {
      const { title, description, details, approveLabel, result } = script.approval
      patch(() => ({ approval: { request: { title, description, details, approveLabel, result }, asking: true, done: false } }))
      setStatus("ready")
      const choice = await new Promise<"approve" | "deny">((resolve) => (decide.current = resolve))
      decide.current = null
      if (!alive()) return
      setStatus("streaming")
      if (choice === "approve") {
        if (!(await runTool(script.approval.then, "after"))) return
        patch((turn) => ({ approval: turn.approval && { ...turn.approval, asking: false, done: true } }))
        answer = script.approval.approved
      } else answer = script.approval.denied
    }

    setStatus("streaming")
    patch(() => ({ streaming: true }))
    const words = answer.split(" ")
    for (let shown = 1; shown <= words.length; shown++) {
      await sleep(35)
      if (!alive()) return
      patch(() => ({ answer: words.slice(0, shown).join(" ") }))
    }
    patch(() => ({ streaming: false }))
    setStatus("ready")
  }

  function stop() {
    run.current++
    abort.current?.abort()
    decide.current = null
    setTurns((all) =>
      all.map((turn) =>
        turn.from === "assistant"
          ? {
              ...turn,
              streaming: false,
              thoughts: turn.thoughts && { ...turn.thoughts, done: true },
              // An approval still waiting when it's stopped won't run: it reads as denied.
              approval: turn.approval?.asking ? { ...turn.approval, asking: false, stopped: true } : turn.approval,
              tools: turn.tools.map((step) => (step.status === "running" ? { ...step, status: "error", description: "Stopped" } : step)),
              after: turn.after.map((step) => (step.status === "running" ? { ...step, status: "error", description: "Stopped" } : step)),
            }
          : turn
      )
    )
    setStatus("ready")
  }

  function newChat() {
    stop()
    setTurns([])
  }

  const busy = status !== "ready"

  return (
    // The whole frame, as the app would be: it fills the window (its height too, so the composer is always in view).
    <div className="flex h-svh min-h-[32rem] bg-card text-card-foreground">
      {/* Past conversations, on wide screens. */}
      {history.length > 0 && (
        <aside aria-label="Conversations" className="hidden w-60 shrink-0 flex-col border-e bg-muted/30 lg:flex">
          <div className="p-3">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={newChat}>
              <MessageSquarePlus /> New conversation
            </Button>
          </div>
          <p className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground">Recent</p>
          <ul className="grid gap-0.5 px-2">
            {history.map((item) => (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => {
                    newChat()
                    ask(item.prompt)
                  }}
                  className="w-full truncate rounded-md px-2 py-1.5 text-start text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <section aria-label="Assistant" className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-text">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium">{title}</h2>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {models.length > 0 && (
            <Select
              aria-label="Model"
              size="sm"
              value={model}
              onValueChange={setModel}
              options={models}
              className="w-auto gap-1.5 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
            />
          )}
          <Tooltip content="New conversation">
            <Button variant="ghost" size="icon-sm" aria-label="New conversation" onClick={newChat} disabled={!turns.length} className="text-muted-foreground lg:hidden">
              <MessageSquarePlus />
            </Button>
          </Tooltip>
        </header>

        <Conversation
          classNames={{ content: "mx-auto w-full max-w-2xl px-4 sm:px-6" }}
          empty={{
            icon: <Sparkles />,
            title: empty.title,
            description: empty.description,
            actions: suggestions.length > 0 && <PromptSuggestions variant="cards" suggestions={suggestions} onSelect={(prompt) => ask(prompt)} className="mt-2 max-w-xl text-start" />,
          }}
        >
          {turns.map((turn) =>
            turn.from === "user" ? (
              <Message key={turn.id} from="user">
                {turn.text}
              </Message>
            ) : (
              <Message
                key={turn.id}
                from="assistant"
                status={turn.error ? "error" : turn.streaming ? "streaming" : "done"}
                error={turn.error}
                showActions={!turn.streaming && (turn.answer || turn.error) ? "hover" : false}
                copyText={turn.answer}
                onRegenerate={busy ? undefined : () => ask(turn.prompt)}
                onFeedbackChange={(feedback) => onFeedback?.({ prompt: turn.prompt, text: turn.answer }, feedback)}
              >
                {turn.thoughts && <Reasoning status={turn.thoughts.done ? "done" : "thinking"}>{turn.thoughts.text}</Reasoning>}
                {turn.tools.length > 0 && <ToolActivity steps={turn.tools} className={cn(turn.thoughts && "mt-2")} />}
                {turn.approval && (
                  <ApprovalCard
                    className="mt-3"
                    title={turn.approval.request.title}
                    description={turn.approval.request.description}
                    details={turn.approval.request.details}
                    approveLabel={turn.approval.request.approveLabel}
                    status={turn.approval.stopped ? "denied" : undefined}
                    result={turn.approval.done ? turn.approval.request.result : undefined}
                    onApprove={() => decide.current?.("approve")}
                    onDeny={() => decide.current?.("deny")}
                  />
                )}
                {turn.after.length > 0 && <ToolActivity steps={turn.after} className="mt-3" />}
                {turn.answer && <p className={cn((turn.thoughts || turn.tools.length > 0 || turn.approval) && "mt-3")}>{turn.answer}</p>}
                {!turn.answer && !turn.error && !turn.thoughts && turn.tools.length === 0 && <span className="text-muted-foreground">Thinking</span>}
              </Message>
            )
          )}
        </Conversation>

        <div className="mx-auto w-full max-w-2xl px-4 pb-4 sm:px-6">
          <PromptComposer
            placeholder={placeholder}
            status={status}
            onStop={stop}
            attachments={{ accept: "image/*,.pdf,.csv", maxFiles: 4, maxSize: 10 * 1024 * 1024 }}
            onSubmit={({ text, files }) => ask(text || "What's in these files?", files)}
            actions={
              webSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={web}
                  onClick={() => setWeb(!web)}
                  className={cn("rounded-full", web && "bg-primary/10 text-primary-text hover:bg-primary/15")}
                >
                  <Globe aria-hidden /> Search
                </Button>
              )
            }
          />
        </div>
      </section>
    </div>
  )
}
