"use client"

import * as React from "react"
import { RotateCcw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Avatar } from "./avatar"
import { Button } from "./button"
import { CopyButton } from "./copy-button"
import { Tooltip } from "./tooltip"

type MessageFrom = "user" | "assistant"
/** "streaming" while words are still arriving; "error" when the answer stopped short. */
type MessageStatus = "streaming" | "done" | "error"
type MessageFeedback = "up" | "down" | null

type MessageProps = Omit<React.ComponentProps<"article">, "children"> & {
  /** Who wrote it: your own messages sit at the end in a bubble, the assistant's open flat beside its avatar. */
  from: MessageFrom
  /** What it says: text (line breaks kept), or your own rendering (Markdown, a table, a chart). */
  children: React.ReactNode
  /** The sender, for the avatar's initials and screen readers. "You" or "Assistant" by default. */
  name?: string
  /** An image URL, or your own mark (a logo). The assistant shows a sparkle by default, you nothing; false hides it. */
  avatar?: string | React.ReactNode | false
  /** When it was sent: a Date (written in the locale) or your own words ("2 min ago"). */
  time?: Date | string
  status?: MessageStatus
  /** What Copy copies. The message's text by default. */
  copyText?: string
  /** Shows Regenerate (and Try again after an error). */
  onRegenerate?: () => void
  /** Good and bad response, controlled or not. Shown when onFeedbackChange is given. */
  feedback?: MessageFeedback
  defaultFeedback?: MessageFeedback
  onFeedbackChange?: (feedback: MessageFeedback) => void
  /** More buttons, after the built-in ones. */
  actions?: React.ReactNode
  /** "hover" shows the actions when the pointer or focus is on the message (always on touch screens). */
  showActions?: "hover" | "always" | false
  /** What an error says. "Couldn't finish this answer." by default. */
  error?: React.ReactNode
  classNames?: { content?: string; avatar?: string; actions?: string; meta?: string }
}

/**
 * One message in a conversation with an assistant: yours in a bubble at the end, the assistant's flat with its avatar,
 * a cursor while it streams in, and Copy, Regenerate and feedback under it.
 */
function Message({
  from,
  children,
  name,
  avatar,
  time,
  status = "done",
  copyText,
  onRegenerate,
  feedback: feedbackProp,
  defaultFeedback = null,
  onFeedbackChange,
  actions,
  showActions = "hover",
  error,
  className,
  classNames,
  ...props
}: MessageProps) {
  const { t, locale } = useLocale()
  const content = React.useRef<HTMLDivElement>(null)
  const [ownFeedback, setOwnFeedback] = React.useState(defaultFeedback)
  const feedback = feedbackProp ?? ownFeedback
  const setFeedback = (next: MessageFeedback) => {
    if (feedbackProp === undefined) setOwnFeedback(next)
    onFeedbackChange?.(next)
  }
  // Copy takes the text as it reads on screen, once the message is complete.
  const [text, setText] = React.useState(copyText ?? (typeof children === "string" ? children : ""))
  React.useEffect(() => {
    if (copyText !== undefined) setText(copyText)
    else if (status !== "streaming") setText(content.current?.innerText.trim() ?? "")
  }, [copyText, status, children])

  const user = from === "user"
  const sender = name ?? (user ? t("you") : t("assistant"))
  const streaming = status === "streaming"
  const showAvatar = avatar !== false && (avatar !== undefined || !user)
  const when =
    time instanceof Date ? { label: time.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }), iso: time.toISOString() } : time ? { label: time } : null

  const buttons = !streaming && showActions !== false && (
    <div
      data-slot="message-actions"
      className={cn(
        "flex items-center gap-0.5 text-muted-foreground transition-opacity duration-(--duration-fast)",
        // Yours sit beside the bubble, so a hidden row doesn't open a gap under it; the assistant's go under the answer.
        user ? "shrink-0" : "-ms-1.5",
        showActions === "hover" && "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100 [@media(hover:none)]:opacity-100",
        classNames?.actions
      )}
    >
      <CopyButton value={text} size="icon-sm" disabled={!text} />
      {!user && onRegenerate && (
        <Tooltip content={t("regenerate")}>
          <Button variant="ghost" size="icon-sm" aria-label={t("regenerate")} onClick={onRegenerate}>
            <RotateCcw />
          </Button>
        </Tooltip>
      )}
      {!user && onFeedbackChange && (
        <>
          <Tooltip content={t("goodResponse")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("goodResponse")}
              aria-pressed={feedback === "up"}
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className={cn(feedback === "up" && "text-foreground")}
            >
              <ThumbsUp className={cn(feedback === "up" && "fill-current")} />
            </Button>
          </Tooltip>
          <Tooltip content={t("badResponse")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("badResponse")}
              aria-pressed={feedback === "down"}
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={cn(feedback === "down" && "text-foreground")}
            >
              <ThumbsDown className={cn(feedback === "down" && "fill-current")} />
            </Button>
          </Tooltip>
        </>
      )}
      {actions}
    </div>
  )

  const body = (
    <div
      ref={content}
      data-slot="message-content"
      dir="auto"
      className={cn(
        "min-w-0 text-sm leading-relaxed [overflow-wrap:anywhere]",
        typeof children === "string" && "whitespace-pre-wrap",
        user ? "rounded-2xl rounded-ee-md bg-primary px-3.5 py-2 text-primary-foreground" : "pt-1",
        // The streaming cursor follows the last word: after the text itself, or inside the last element (a paragraph,
        // a list item) when the content is your own rendering, so it never drops to a line of its own.
        streaming &&
          (typeof children === "string"
            ? "after:ms-0.5 after:inline-block after:h-[1.1em] after:w-[0.45em] after:translate-y-[0.18em] after:rounded-[1px] after:bg-foreground/70 after:content-[''] motion-safe:after:animate-pulse"
            : "[&>:last-child]:after:ms-0.5 [&>:last-child]:after:inline-block [&>:last-child]:after:h-[1.1em] [&>:last-child]:after:w-[0.45em] [&>:last-child]:after:translate-y-[0.18em] [&>:last-child]:after:rounded-[1px] [&>:last-child]:after:bg-foreground/70 [&>:last-child]:after:content-[''] motion-safe:[&>:last-child]:after:animate-pulse"),
        classNames?.content
      )}
    >
      {children}
    </div>
  )

  return (
    <article
      data-slot="message"
      data-from={from}
      data-status={status}
      aria-label={sender}
      // While words are still arriving, screen readers wait for the whole answer instead of reading each one.
      aria-busy={streaming || undefined}
      className={cn("group/message flex w-full gap-3", user && "flex-row-reverse", className)}
      {...props}
    >
      {showAvatar &&
        (avatar === undefined ? (
          <span aria-hidden className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-text", classNames?.avatar)}>
            <Sparkles className="size-4" />
          </span>
        ) : typeof avatar === "string" ? (
          <Avatar src={avatar} name={sender} alt="" size="sm" className={cn("mt-0.5", classNames?.avatar)} />
        ) : (
          <span aria-hidden className={cn("mt-0.5 grid size-8 shrink-0 place-items-center", classNames?.avatar)}>
            {avatar}
          </span>
        ))}
      <div className={cn("flex min-w-0 flex-col", user ? "max-w-[85%] items-end gap-1" : "flex-1 gap-1.5")}>
        {user ? (
          <div className="flex min-w-0 items-center gap-1">
            {buttons}
            {body}
          </div>
        ) : (
          body
        )}
        {status === "error" && (
          <div role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-destructive-text">
            {error ?? t("messageFailed")}
            {onRegenerate && (
              <Button variant="link" color="destructive" size="inline" onClick={onRegenerate}>
                {t("tryAgain")}
              </Button>
            )}
          </div>
        )}
        {(when || (buttons && !user)) && (
          <div className={cn("flex items-center gap-2", classNames?.meta)}>
            {!user && buttons}
            {when && (
              <time dateTime={when.iso} className="text-xs text-muted-foreground tabular-nums">
                {when.label}
              </time>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export { Message, type MessageProps, type MessageFrom, type MessageStatus, type MessageFeedback }
