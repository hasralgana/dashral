import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../lib/utils"

type BreadcrumbItem = {
  label: React.ReactNode
  /** Where it links. The last item is the current page and never links. */
  href?: string
  icon?: React.ReactNode
}

type BreadcrumbProps = Omit<React.ComponentProps<"nav">, "children"> & {
  items: BreadcrumbItem[]
  /** Your router's link, e.g. Next.js Link; a plain <a> by default. */
  linkAs?: React.ElementType
  /** Longer trails show the first item, an ellipsis and the last ones; the ellipsis shows the rest when pressed. */
  maxItems?: number
  /** Between items; a chevron by default. */
  /** The collapsed pages' button, for screen readers; {count} is how many it shows. */
  moreLabel?: string
  separator?: React.ReactNode
  classNames?: { list?: string; item?: string; link?: string; page?: string; separator?: string }
}

/**
 * Where the current page sits in the site's hierarchy, in one tag. Put one per page, above the title. It works without
 * JavaScript, so it can take your router's link from a server component.
 */
function Breadcrumb({
  items,
  linkAs: LinkComponent = "a",
  maxItems,
  separator = <ChevronRight className="rtl:-scale-x-100" />,
  "aria-label": ariaLabel = "Breadcrumb",
  moreLabel = "Show {count} more pages",
  className,
  classNames,
  ...props
}: BreadcrumbProps) {
  // Past maxItems: the first item, an ellipsis, and the last ones. The middle stays in the page, hidden until the
  // ellipsis (a checkbox, so it needs no script) is ticked.
  const collapse = maxItems !== undefined && maxItems >= 2 && items.length > maxItems
  const hiddenFrom = 1
  const hiddenTo = collapse ? items.length - (maxItems - 1) : 1
  const hidden = (i: number) => collapse && i >= hiddenFrom && i < hiddenTo
  const whenHidden = "hidden group-has-[[data-slot=breadcrumb-expand]:checked]/breadcrumb:inline-flex"

  return (
    <nav data-slot="breadcrumb" aria-label={ariaLabel} className={cn("group/breadcrumb", className)} {...props}>
      <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground", classNames?.list)}>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <React.Fragment key={i}>
              {collapse && i === hiddenFrom && (
                <>
                  <li className="inline-flex items-center group-has-[[data-slot=breadcrumb-expand]:checked]/breadcrumb:hidden">
                    <label className="flex size-5 items-center justify-center rounded-sm outline-none hover:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50 [&_svg]:size-4">
                      <input type="checkbox" data-slot="breadcrumb-expand" className="sr-only" />
                      <MoreHorizontal aria-hidden />
                      <span className="sr-only">{moreLabel.replace("{count}", String(hiddenTo - hiddenFrom))}</span>
                    </label>
                  </li>
                  <li role="presentation" aria-hidden className={cn("group-has-[[data-slot=breadcrumb-expand]:checked]/breadcrumb:hidden [&>svg]:size-3.5", classNames?.separator)}>
                    {separator}
                  </li>
                </>
              )}
              <li className={cn("inline-flex items-center gap-1.5 [&_svg]:size-3.5", hidden(i) && whenHidden, classNames?.item)}>
                {last || !item.href ? (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn("inline-flex items-center gap-1.5", last && "font-medium text-foreground", classNames?.page)}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  <LinkComponent
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                      classNames?.link
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </LinkComponent>
                )}
              </li>
              {!last && (
                <li role="presentation" aria-hidden className={cn("[&>svg]:size-3.5", hidden(i) && whenHidden, classNames?.separator)}>
                  {separator}
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem }
