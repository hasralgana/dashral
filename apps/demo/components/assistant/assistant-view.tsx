"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquareText, Plus, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { ApprovalCard, type ApprovalStatus } from "@dashral/ui/components/approval-card"
import { Button } from "@dashral/ui/components/button"
import { Conversation } from "@dashral/ui/components/conversation"
import { Message } from "@dashral/ui/components/message"
import { PromptComposer } from "@dashral/ui/components/prompt-composer"
import { PromptSuggestions } from "@dashral/ui/components/prompt-suggestions"
import { Reasoning } from "@dashral/ui/components/reasoning"
import { ToolActivity, type ToolStep } from "@dashral/ui/components/tool-activity"
import { toast } from "@dashral/ui/components/toast"
import { cn } from "@dashral/ui/lib/utils"

// Scripted answers: no model is called. Each scenario thinks, runs its tools one by one, then writes its answer word
// by word. Put your model behind `ask` to make it real.
const scenarios = ["runway", "tickets", "reminders"] as const
type Scenario = (typeof scenarios)[number] | "general"

const tools: Record<Scenario, { key: "balances" | "burn" | "tickets" | "invoices"; output: unknown }[]> = {
  runway: [
    { key: "balances", output: { operating: 412800, reserve: 1250000 } },
    { key: "burn", output: { months: 3, average: 41200 } },
  ],
  tickets: [{ key: "tickets", output: { open: 8, late: 3 } }],
  reminders: [{ key: "invoices", output: { overdue: 3, total: 1240 } }],
  general: [],
}

type Turn = {
  id: number
  prompt: string
  scenario: Scenario
  thinking: boolean
  /** How many of its tools have finished. */
  toolsDone: number
  /** The answer's words shown so far. */
  words: number
  approval?: ApprovalStatus
}

export function AssistantView() {
  const t = useTranslations("assistant")
  const [turns, setTurns] = useState<Turn[]>([])
  const [history, setHistory] = useState<string[]>(() => [t("history.0"), t("history.1"), t("history.2")])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const answerOf = (turn: Turn) => t(`scenarios.${turn.scenario}.answer`)
  const busy = turns.some((turn) => turn.thinking || turn.toolsDone < tools[turn.scenario].length || turn.words < answerOf(turn).split(" ").length)
  const update = (id: number, change: (turn: Turn) => Partial<Turn>) =>
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...change(turn) } : turn)))
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))

  function ask(prompt: string) {
    const text = prompt.trim()
    if (!text || busy) return
    const scenario = scenarios.find((key) => t(`scenarios.${key}.prompt`) === text) ?? "general"
    const id = Date.now()
    const words = t(`scenarios.${scenario}.answer`).split(" ").length
    setTurns((current) => [...current, { id, prompt: text, scenario, thinking: true, toolsDone: 0, words: 0, approval: scenario === "reminders" ? "pending" : undefined }])
    if (turns.length === 0) setHistory((current) => [text, ...current].slice(0, 6))
    let at = 1100
    later(at, () => update(id, () => ({ thinking: false })))
    for (let i = 0; i < tools[scenario].length; i++) {
      at += 750
      later(at, () => update(id, () => ({ toolsDone: i + 1 })))
    }
    for (let w = 1; w <= words; w++) later(at + 120 + w * 32, () => update(id, () => ({ words: w })))
  }

  return (
    // Fills the page under its header (app/(assistant)/layout.tsx): conversations on the left, the chat beside them.
    <div className="flex h-full min-h-0">
      <aside aria-label={t("history.label")} className="hidden w-64 shrink-0 flex-col border-e border-divider bg-muted/30 lg:flex">
        <div className="p-3">
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTurns([])} disabled={busy}>
            <Plus /> {t("newChat")}
          </Button>
        </div>
        <p className="px-4 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">{t("history.recent")}</p>
        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {history.map((title, i) => (
            <li key={`${title}-${i}`}>
              <button
                type="button"
                onClick={() => toast(t("history.demo"))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm text-muted-foreground outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section aria-label={t("title")} className="flex min-w-0 flex-1 flex-col">
        <Conversation
          className="flex-1"
          aria-label={t("conversation")}
          empty={{
            icon: <Sparkles />,
            title: t("empty.title"),
            description: t("empty.description"),
            actions: (
              <PromptSuggestions
                variant="cards"
                suggestions={scenarios.map((key) => t(`scenarios.${key}.prompt`))}
                onSelect={ask}
                className="max-w-2xl"
              />
            ),
          }}
          classNames={{ content: "mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6" }}
        >
          {turns.length > 0 &&
            turns.map((turn) => {
              const answer = answerOf(turn)
              const allWords = answer.split(" ")
              const steps: ToolStep[] = tools[turn.scenario].map((tool, i) => ({
                id: tool.key,
                name: t(`tools.${tool.key}`),
                status: turn.thinking ? "pending" : i < turn.toolsDone ? "done" : i === turn.toolsDone ? "running" : "pending",
                output: i < turn.toolsDone ? tool.output : undefined,
                duration: i < turn.toolsDone ? 640 + i * 110 : undefined,
              }))
              const writing = turn.words > 0 && turn.words < allWords.length
              const done = turn.words === allWords.length
              return (
                <div key={turn.id} className="space-y-4">
                  <Message from="user">{turn.prompt}</Message>
                  <Message
                    from="assistant"
                    status={writing ? "streaming" : "done"}
                    copyText={done ? answer : undefined}
                    onFeedbackChange={(feedback) => feedback && toast(t("feedback"))}
                    showActions={done ? "hover" : false}
                  >
                    <div className="space-y-3">
                      <Reasoning status={turn.thinking ? "thinking" : "done"} duration={turn.thinking ? undefined : 1.1}>
                        {t(`scenarios.${turn.scenario}.thoughts`)}
                      </Reasoning>
                      {steps.length > 0 && !turn.thinking && <ToolActivity steps={steps} aria-label={t("toolsLabel")} />}
                      {turn.words > 0 && <p className={cn("whitespace-pre-line")}>{allWords.slice(0, turn.words).join(" ")}</p>}
                      {done && turn.approval && (
                        <ApprovalCard
                          title={t("approval.title")}
                          description={t("approval.description")}
                          details={[
                            { label: t("approval.to"), value: t("approval.toValue") },
                            { label: t("approval.total"), value: "$1,240" },
                          ]}
                          status={turn.approval}
                          onApprove={() => {
                            update(turn.id, () => ({ approval: "approved" }))
                            toast.success(t("approval.sent"))
                          }}
                          onDeny={() => update(turn.id, () => ({ approval: "denied" }))}
                          approveLabel={t("approval.approve")}
                          denyLabel={t("approval.deny")}
                          result={turn.approval === "approved" ? t("approval.approved") : turn.approval === "denied" ? t("approval.denied") : undefined}
                        />
                      )}
                    </div>
                  </Message>
                </div>
              )
            })}
        </Conversation>

        <div className="border-t border-divider p-3 md:p-4">
          <div className="mx-auto w-full max-w-3xl space-y-2">
            {/* On narrow screens the conversations column is hidden, so "New chat" sits here. */}
            {turns.length > 0 && !busy && (
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setTurns([])}>
                <Plus /> {t("newChat")}
              </Button>
            )}
            {turns.length > 0 && !busy && (
              <PromptSuggestions suggestions={scenarios.filter((key) => !turns.some((turn) => turn.scenario === key)).map((key) => t(`scenarios.${key}.prompt`))} onSelect={ask} scroll />
            )}
            <PromptComposer
              placeholder={t("placeholder")}
              onSubmit={({ text }) => ask(text)}
              disabled={busy}
              attachments={{ accept: "image/*,.pdf,.csv", maxFiles: 3 }}
            />
            <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
