import * as React from "react"

import { cn } from "../lib/utils"

type ProseProps = React.ComponentProps<"div"> & {
  /** sm for a sidebar or a card, lg for a reading page. */
  size?: "sm" | "default" | "lg"
  /** Render your own element instead of a div, e.g. "article". */
  as?: "div" | "article" | "section" | "main"
}

// Styles for plain HTML elements inside: what Markdown, MDX or a CMS produces. Kit components inside (they carry
// data-slot) keep their own looks. Every class is written out in full so Tailwind finds it.
const base = [
  "text-foreground/90 [overflow-wrap:anywhere]",
  // Spacing between blocks: everything after the first gets space above, so the first and last sit flush.
  "[&>*+*]:mt-[1.1em]",
  // Headings
  "[&_:is(h1,h2,h3,h4):not([data-slot])]:font-heading [&_:is(h1,h2,h3,h4):not([data-slot])]:font-semibold [&_:is(h1,h2,h3,h4):not([data-slot])]:tracking-tight [&_:is(h1,h2,h3,h4):not([data-slot])]:text-foreground [&_:is(h1,h2,h3,h4):not([data-slot])]:text-balance [&_:is(h1,h2,h3,h4):not([data-slot])]:scroll-mt-20",
  "[&_h1:not([data-slot])]:text-[2em] [&_h1:not([data-slot])]:leading-tight",
  "[&_h2:not([data-slot])]:text-[1.5em] [&_h2:not([data-slot])]:leading-snug [&>h2:not(:first-child)]:mt-[2em]",
  "[&_h3:not([data-slot])]:text-[1.25em] [&_h3:not([data-slot])]:leading-snug [&>h3:not(:first-child)]:mt-[1.6em]",
  "[&_h4:not([data-slot])]:text-[1em] [&>h4:not(:first-child)]:mt-[1.4em]",
  "[&>:is(h2,h3,h4)+*]:mt-[0.6em]",
  // Text
  "[&_p:not([data-slot])]:text-pretty",
  "[&_a:not([data-slot])]:font-medium [&_a:not([data-slot])]:text-primary-text [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:decoration-primary/40 [&_a:not([data-slot])]:underline-offset-4 [&_a:not([data-slot]):hover]:decoration-primary",
  "[&_strong:not([data-slot])]:font-semibold [&_strong:not([data-slot])]:text-foreground",
  "[&_mark:not([data-slot])]:rounded-sm [&_mark:not([data-slot])]:bg-highlight/20 [&_mark:not([data-slot])]:px-0.5 [&_mark:not([data-slot])]:text-inherit",
  // Lists
  "[&_ul:not([data-slot])]:list-disc [&_ol:not([data-slot])]:list-decimal [&_:is(ul,ol):not([data-slot])]:ps-[1.5em] [&_li:not([data-slot])]:ps-[0.25em] [&_li+li]:mt-[0.4em] [&_li>:is(ul,ol)]:mt-[0.4em] [&_li::marker]:text-muted-foreground",
  // Quotes and rules
  "[&_blockquote:not([data-slot])]:border-s-2 [&_blockquote:not([data-slot])]:ps-[1em] [&_blockquote:not([data-slot])]:text-muted-foreground [&_blockquote:not([data-slot])]:italic",
  "[&_hr:not([data-slot])]:my-[2em] [&_hr:not([data-slot])]:border-border",
  // Code: inline in a soft pill, blocks in a panel that scrolls sideways, always left to right.
  "[&_:not(pre)>code:not([data-slot])]:rounded-[0.3em] [&_:not(pre)>code:not([data-slot])]:bg-muted [&_:not(pre)>code:not([data-slot])]:px-[0.35em] [&_:not(pre)>code:not([data-slot])]:py-[0.1em] [&_:not(pre)>code:not([data-slot])]:font-mono [&_:not(pre)>code:not([data-slot])]:text-[0.875em]",
  "[&_pre:not([data-slot])]:overflow-x-auto [&_pre:not([data-slot])]:rounded-lg [&_pre:not([data-slot])]:border [&_pre:not([data-slot])]:bg-muted/40 [&_pre:not([data-slot])]:px-[1em] [&_pre:not([data-slot])]:py-[0.85em] [&_pre:not([data-slot])]:font-mono [&_pre:not([data-slot])]:text-[0.875em] [&_pre:not([data-slot])]:leading-relaxed [&_pre:not([data-slot])]:[direction:ltr]",
  "[&_kbd:not([data-slot])]:rounded-[0.3em] [&_kbd:not([data-slot])]:border [&_kbd:not([data-slot])]:bg-muted [&_kbd:not([data-slot])]:px-[0.35em] [&_kbd:not([data-slot])]:font-mono [&_kbd:not([data-slot])]:text-[0.8em]",
  // Media
  "[&_:is(img,video):not([data-slot])]:h-auto [&_:is(img,video):not([data-slot])]:max-w-full [&_:is(img,video):not([data-slot])]:rounded-lg",
  "[&_figcaption:not([data-slot])]:mt-[0.6em] [&_figcaption:not([data-slot])]:text-center [&_figcaption:not([data-slot])]:text-[0.875em] [&_figcaption:not([data-slot])]:text-muted-foreground",
  // Tables: full width, lines between rows, scrolling sideways on a phone through the wrapping block's overflow.
  "[&_table:not([data-slot])]:w-full [&_table:not([data-slot])]:border-collapse [&_table:not([data-slot])]:text-[0.875em]",
  "[&_:is(th,td):not([data-slot])]:border-b [&_:is(th,td):not([data-slot])]:px-[0.75em] [&_:is(th,td):not([data-slot])]:py-[0.5em] [&_:is(th,td):not([data-slot])]:text-start [&_:is(th,td):not([data-slot])]:align-top",
  "[&_th:not([data-slot])]:font-medium [&_th:not([data-slot])]:text-foreground",
]

const sizes = { sm: "text-sm leading-6", default: "text-base leading-7", lg: "text-lg leading-8" }

/**
 * Good-looking text from plain HTML, in one tag: wrap the output of Markdown, MDX or a CMS in `<Prose>` and its
 * headings, paragraphs, links, lists, quotes, code, tables and images are set for reading, in light and dark, right to
 * left included. Kit components inside keep their own looks. Give it a width (max-w-prose) for comfortable lines.
 */
function Prose({ size = "default", as: Component = "div", className, ...props }: ProseProps) {
  return <Component data-slot="prose" className={cn(base, sizes[size], className)} {...props} />
}

export { Prose, type ProseProps }
