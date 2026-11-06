import * as React from "react"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb"

type PageHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** The page's name, as its heading. */
  title: React.ReactNode
  /** A line under the title: what the page is for. */
  description?: React.ReactNode
  /** The heading's level: h1 (default) for the page, h2 for a section with a header of its own. */
  titleAs?: "h1" | "h2"
  /** Above the title: the trail to this page, drawn with Breadcrumb. */
  breadcrumb?: BreadcrumbItem[]
  /** Above the title instead of a breadcrumb: a link back, "← Invoices". */
  back?: { href: string; label: React.ReactNode }
  /** Beside the title, e.g. a status badge. */
  badge?: React.ReactNode
  /** A row under the title: who made it, when, a few badges. */
  meta?: React.ReactNode
  /** At the end: the page's buttons. On a phone they move under the title. */
  actions?: React.ReactNode
  /** Under everything, e.g. Tabs with variant="line"; with divided, the line runs under them. */
  tabs?: React.ReactNode
  /** A line under the header. */
  divided?: boolean
  /** sm for a page inside a panel or a settings section. */
  size?: "sm" | "default"
  /** Your router's link, for the breadcrumb and the back link. */
  linkAs?: React.ElementType
  classNames?: { title?: string; description?: string; meta?: string; actions?: string }
}

/**
 * The top of an admin page, in one tag: a breadcrumb or a back link, the title (a real heading) with a badge, a
 * description, a row of details, the page's actions and tabs. On a phone the actions wrap under the title.
 */
function PageHeader({
  title,
  description,
  titleAs: Title = "h1",
  breadcrumb,
  back,
  badge,
  meta,
  actions,
  tabs,
  divided = false,
  size = "default",
  linkAs: Link = "a",
  className,
  classNames,
  ...props
}: PageHeaderProps) {
  const sm = size === "sm"
  return (
    <header data-slot="page-header" className={cn("grid gap-4", divided && !tabs && (sm ? "border-b pb-4" : "border-b pb-6"), className)} {...props}>
      {(breadcrumb || back) && (
        <div className="-mb-1">
          {breadcrumb ? (
            <Breadcrumb items={breadcrumb} linkAs={Link} />
          ) : (
            back && (
              <Link
                href={back.href}
                className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ArrowLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" />
                {back.label}
              </Link>
            )
          )}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid min-w-0 gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Title
              className={cn(
                "min-w-0 font-heading font-medium text-balance",
                sm ? "text-lg leading-snug tracking-tight" : "text-2xl leading-tight tracking-[-0.03em] sm:text-[28px]",
                classNames?.title
              )}
            >
              {title}
            </Title>
            {badge}
          </div>
          {description && (
            <p className={cn("max-w-2xl text-sm leading-[1.55] text-pretty text-muted-foreground", classNames?.description)}>{description}</p>
          )}
          {meta && (
            <div className={cn("mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground [&_svg]:size-3.5", classNames?.meta)}>
              {meta}
            </div>
          )}
        </div>
        {actions && <div className={cn("flex shrink-0 flex-wrap items-center gap-2", classNames?.actions)}>{actions}</div>}
      </div>
      {tabs && <div className={cn(divided && "border-b")}>{tabs}</div>}
    </header>
  )
}

export { PageHeader, type PageHeaderProps }
