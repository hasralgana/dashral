"use client"

import * as React from "react"
import { ArrowDown } from "lucide-react"

import { useLocale } from "../lib/locale"
import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { EmptyState, type EmptyStateProps } from "./empty-state"
import { ScrollShadow } from "./scroll-shadow"

type ConversationEmpty = Pick<EmptyStateProps, "icon" | "title" | "description" | "actions">

type ConversationProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The messages, oldest first: Message, or anything of your own. */
  children?: React.ReactNode
  /** What shows in the middle while there are no messages: EmptyState's props, or your own content. */
  empty?: ConversationEmpty | React.ReactNode
  /** Keeps the newest message in view while it streams, until the reader scrolls up. On by default. */
  stickToBottom?: boolean
  /** How far the top and bottom edges fade while there's more to scroll that way, in px. */
  fade?: number
  /** Show the scrollbar as well as the fade. */
  scrollbar?: boolean
  /** Names the conversation for screen readers. "Conversation" by default. */
  "aria-label"?: string
  classNames?: { viewport?: string; content?: string; jump?: string }
}

/** How close to the bottom (in px) still counts as being at the bottom. */
const NEAR_BOTTOM = 48

const isEmptyProps = (value: unknown): value is ConversationEmpty =>
  typeof value === "object" && value !== null && !React.isValidElement(value) && !Array.isArray(value)

/**
 * The scrolling part of a chat with an assistant. Give it a fixed height (a flex column's remaining space, say) and
 * it scrolls inside, its edges fading while there's more above or below: the newest message stays in view while it streams, until the reader scrolls up to read, when
 * "Jump to latest" appears. Sending a message brings the bottom back. With no messages, `empty` fills the middle.
 */
function Conversation({ children, empty, stickToBottom = true, fade = 32, scrollbar = false, className, classNames, "aria-label": ariaLabel, ...props }: ConversationProps) {
  const { t } = useLocale()
  const viewport = React.useRef<HTMLElement>(null)
  const content = React.useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  // Read inside the observer, which keeps its first closure.
  const following = React.useRef(true)
  const lastTop = React.useRef(0)
  const hasMessages = React.Children.toArray(children).length > 0

  const scrollToBottom = React.useCallback((smooth: boolean) => {
    const el = viewport.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reducedMotion() ? "smooth" : "auto" })
  }, [])

  // As the content grows (a new message, words streaming in), follow it while the reader is at the bottom; a message
  // of your own brings the bottom back wherever you were.
  React.useLayoutEffect(() => {
    const el = content.current
    // An empty state reads from its top: following the bottom only starts with the first message.
    if (!el || !stickToBottom || !hasMessages) return
    let count = el.childElementCount
    const observer = new ResizeObserver(() => {
      const added = el.childElementCount > count
      count = el.childElementCount
      // Your own message: the last child is a Message from you (or wraps one).
      const last = el.lastElementChild
      const sentByYou = added && Boolean(last?.matches('[data-from="user"]') || last?.firstElementChild?.matches('[data-from="user"]'))
      if (following.current || sentByYou) {
        following.current = true
        setAtBottom(true)
        scrollToBottom(false)
      }
    })
    observer.observe(el)
    scrollToBottom(false)
    return () => observer.disconnect()
  }, [stickToBottom, scrollToBottom, hasMessages])

  // Only scrolling up stops the following: scrolling down (yours, or the composer's own smooth jump) never does,
  // and reaching the bottom starts it again.
  function onScroll() {
    const el = viewport.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM
    if (near) following.current = true
    else if (el.scrollTop < lastTop.current) following.current = false
    lastTop.current = el.scrollTop
    setAtBottom(near)
  }

  return (
    <div data-slot="conversation" className={cn("relative flex min-h-0 flex-1 flex-col", className)} {...props}>
      {/* Its edges fade while there's more to scroll that way: the fade says the conversation goes on. */}
      <ScrollShadow
        ref={viewport}
        onScroll={onScroll}
        size={fade}
        scrollbar={scrollbar}
        data-slot="conversation-viewport"
        // A scroll area with the keyboard too (arrow keys, Page Up/Down) when nothing inside has focus.
        tabIndex={hasMessages ? 0 : -1}
        className={cn("min-h-0 flex-1 overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset", classNames?.viewport)}
      >
        <div
          ref={content}
          role="log"
          aria-label={ariaLabel ?? t("conversation")}
          className={cn("flex min-h-full flex-col gap-6 p-4", !hasMessages && "justify-center", classNames?.content)}
        >
          {hasMessages
            ? children
            : isEmptyProps(empty)
              ? <EmptyState variant="plain" titleAs="h2" {...empty} />
              : empty}
        </div>
      </ScrollShadow>
      {stickToBottom && hasMessages && !atBottom && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("jumpToLatest")}
          onClick={() => {
            following.current = true
            setAtBottom(true)
            scrollToBottom(true)
          }}
          className={cn(
            "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background shadow-md animate-in fade-in-0 zoom-in-95 duration-(--duration-fast)",
            classNames?.jump
          )}
        >
          <ArrowDown aria-hidden />
        </Button>
      )}
    </div>
  )
}

export { Conversation, type ConversationProps, type ConversationEmpty }
