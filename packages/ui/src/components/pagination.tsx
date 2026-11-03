"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { buttonVariants, type Button } from "./button"

type PaginationProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** The current page, from 1. */
  page: number
  /** How many pages there are. */
  total: number
  /** Called with the page to go to. Leave it out and give hrefPattern for plain links. */
  onPageChange?: (page: number) => void
  /**
   * Each page's URL, with {page} where the number goes: "?page={page}". Links work without JavaScript (and search
   * engines follow them); being a string, it can come from a server component.
   */
  hrefPattern?: string
  /** Your router's link for hrefPattern, e.g. Next.js Link (from a client component); a plain <a> by default. */
  linkAs?: React.ElementType
  /** Pages shown on each side of the current one before an ellipsis. */
  siblings?: number
  /** The Previous and Next buttons. */
  showPrevNext?: boolean
  /** Arrows around "Page 2 of 7", for a narrow card. Phones always get this; compact keeps it on wider screens. */
  compact?: boolean
  /**
   * The look: quiet links with an outlined current page (default), every page in its own box with the current one
   * filled (outline), or the pages in one pill with a sliding highlight (pill).
   */
  variant?: PaginationVariant
}

type PaginationVariant = "default" | "outline" | "pill"

/** The variant, for the parts (content, links and the sliding thumb) without passing it through each. */
const VariantContext = React.createContext<PaginationVariant>("default")

/**
 * Page links in one tag: Previous, the page numbers with ellipses for the gaps, and Next. Buttons with onPageChange,
 * links with hrefPattern. The current page's outline slides to the page you open.
 */
function Pagination({
  page,
  total,
  onPageChange,
  hrefPattern,
  linkAs = "a",
  siblings = 1,
  showPrevNext = true,
  compact = false,
  variant = "default",
  className,
  ...props
}: PaginationProps) {
  const { t, locale } = useLocale()
  const number = new Intl.NumberFormat(locale)
  const go = (to: number) => {
    const target = Math.min(total, Math.max(1, to))
    return hrefPattern
      ? { as: linkAs, href: hrefPattern.replaceAll("{page}", String(target)) }
      : { as: "button" as const, type: "button" as const, onClick: () => onPageChange?.(target) }
  }
  // Arrows only when compact: the words "Previous" and "Next" don't fit.
  const arrow = compact ? "size-9 px-0 sm:px-0 [&>span]:hidden" : undefined
  const numbers = compact ? "hidden" : "max-sm:hidden"
  return (
    <VariantContext.Provider value={variant}>
      <nav aria-label={t("pagination")} data-slot="pagination" data-variant={variant} className={cn("mx-auto flex w-full justify-center", className)} {...props}>
        <PaginationContent>
          {showPrevNext && (
            <li>
              <PaginationPrevious {...go(page - 1)} disabled={page <= 1} className={arrow} />
            </li>
          )}
          {getPageRange(page, total, siblings).map((item, i) =>
            item === "ellipsis" ? (
              <li key={`gap-${i}`} className={numbers}>
                <PaginationEllipsis />
              </li>
            ) : (
              <li key={item} className={numbers}>
                <PaginationLink {...go(item)} isActive={item === page} aria-label={t("page", { page: item })}>
                  {number.format(item)}
                </PaginationLink>
              </li>
            )
          )}
          {/* Where you are, in words, when there's no room for the numbers. */}
          <li className={cn("px-2 text-sm text-muted-foreground tabular-nums", !compact && "sm:hidden")}>
            {t("pageOf", { page, total })}
          </li>
          {showPrevNext && (
            <li>
              <PaginationNext {...go(page + 1)} disabled={page >= total} className={arrow} />
            </li>
          )}
        </PaginationContent>
      </nav>
    </VariantContext.Provider>
  )
}

/** The row of links. The current page's outline slides to the page you open (it just moves with reduced motion). */
function PaginationContent({ className, children, ...props }: React.ComponentProps<"ul">) {
  const variant = React.useContext(VariantContext)
  const ref = React.useRef<HTMLUListElement>(null)
  const [thumb, setThumb] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Measure the current page's link; again when the row resizes or the page changes.
  React.useLayoutEffect(() => {
    const list = ref.current
    if (!list) return
    const measure = () => {
      const link = list.querySelector<HTMLElement>("[data-slot=pagination-link][data-active=true]")
      setThumb(link ? { x: link.offsetLeft, y: link.offsetTop, width: link.offsetWidth, height: link.offsetHeight } : null)
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(list)
    const changes = new MutationObserver(measure)
    changes.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-active"], childList: true })
    return () => {
      resize.disconnect()
      changes.disconnect()
    }
  }, [])

  return (
    <ul
      ref={ref}
      data-slot="pagination-content"
      data-measured={thumb ? "" : undefined}
      className={cn("relative flex flex-row items-center gap-1", variant === "pill" && "gap-0.5 rounded-full border bg-muted p-1 dark:bg-muted/60", className)}
      {...props}
    >
      {thumb && (
        <li
          aria-hidden
          data-slot="pagination-thumb"
          className={cn(
            "pointer-events-none absolute top-0 left-0 transition-[translate,width,height] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
            {
              default: "rounded-md border bg-card shadow-xs dark:border-input dark:bg-input/30",
              outline: "rounded-md bg-primary shadow-xs",
              pill: "rounded-full bg-background shadow-sm ring-1 ring-black/5 dark:bg-accent dark:ring-white/10",
            }[variant]
          )}
          style={{ translate: `${thumb.x}px ${thumb.y}px`, width: thumb.width, height: thumb.height }}
        />
      )}
      {children}
    </ul>
  )
}

type PaginationLinkProps = {
  isActive?: boolean
  /** A button, a plain link, or your router's link. */
  as?: React.ElementType
  disabled?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  Omit<React.ComponentProps<"a">, "type"> & { type?: "button" }

/**
 * A page link. The current page's outline is PaginationContent's sliding thumb (before it's measured, the link draws
 * its own). A number that changes — the window of pages moving — arrives with a soft blur.
 */
function PaginationLink({ className, isActive, size = "icon", as: Comp = "a", disabled, children, ...props }: PaginationLinkProps) {
  const variant = React.useContext(VariantContext)
  const text = typeof children === "number" || typeof children === "string" ? String(children) : null
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
      disabled={Comp === "button" ? disabled : undefined}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size }),
        "relative tabular-nums aria-disabled:pointer-events-none aria-disabled:opacity-50",
        variant === "outline" && "border border-input bg-card shadow-xs hover:bg-accent dark:bg-input/30",
        variant === "pill" && "rounded-full hover:bg-background/60 dark:hover:bg-accent/60",
        isActive &&
          {
            default:
              "hover:bg-transparent not-in-data-measured:border not-in-data-measured:bg-card not-in-data-measured:shadow-xs dark:not-in-data-measured:border-input dark:not-in-data-measured:bg-input/30",
            outline:
              "border-transparent bg-transparent text-primary-foreground shadow-none hover:bg-transparent hover:text-primary-foreground not-in-data-measured:bg-primary dark:bg-transparent",
            pill: "hover:bg-transparent not-in-data-measured:bg-background not-in-data-measured:shadow-xs dark:not-in-data-measured:bg-accent",
          }[variant],
        className
      )}
      {...props}
    >
      {text === null ? (
        children
      ) : (
        <span
          key={text}
          className="animate-in fade-in-0 zoom-in-90 blur-in-[2px] duration-(--duration-standard) ease-spring motion-reduce:animate-none"
        >
          {text}
        </span>
      )}
    </Comp>
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useLocale()
  return (
    <PaginationLink
      aria-label={t("previousPage")}
      size="default"
      className={cn("gap-1 px-2.5 sm:ps-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="rtl:-scale-x-100" />
      <span className="hidden sm:block">{t("previous")}</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useLocale()
  return (
    <PaginationLink
      aria-label={t("nextPage")}
      size="default"
      className={cn("gap-1 px-2.5 sm:pe-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{t("next")}</span>
      <ChevronRightIcon className="rtl:-scale-x-100" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  const { t } = useLocale()
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">{t("morePages")}</span>
    </span>
  )
}

/**
 * Page numbers to render, with "ellipsis" gaps — e.g. getPageRange(6, 20) → [1, "ellipsis", 5, 6, 7, "ellipsis", 20].
 */
function getPageRange(current: number, total: number, siblings = 1): (number | "ellipsis")[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  if (total <= 5 + siblings * 2) return range(1, total)

  const left = Math.max(current - siblings, 2)
  const right = Math.min(current + siblings, total - 1)
  return [
    1,
    ...(left > 2 ? (["ellipsis"] as const) : []),
    ...range(left, right),
    ...(right < total - 1 ? (["ellipsis"] as const) : []),
    total,
  ]
}

export { Pagination, getPageRange, type PaginationProps }
