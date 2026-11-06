import * as React from "react"

import { cn } from "../lib/utils"

type FormSectionProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** What the fields are about: "Profile", "Notifications", "Danger zone". */
  title: React.ReactNode
  /** A line or two on what changing them does. */
  description?: React.ReactNode
  /** The heading's level, to fit the page's outline. */
  titleAs?: "h2" | "h3"
  /** The fields. */
  children: React.ReactNode
  /** Under the fields: the section's buttons, e.g. Save. With variant="card", a bar along the card's foot. */
  footer?: React.ReactNode
  /** split (default): the title at the side and the fields beside it, from the md breakpoint (stacked below). stacked: the title above. */
  layout?: "split" | "stacked"
  /** plain: the fields on the page; card: in a bordered card with the footer as its bottom bar. */
  variant?: "plain" | "card"
  /** A line above the section, to part it from the one before. */
  divided?: boolean
  classNames?: { header?: string; title?: string; description?: string; content?: string; footer?: string }
}

/**
 * One group of a settings page, in one tag: `<FormSection title="Profile" description="…" footer={<Button>Save</Button>}>`.
 * The title and description sit at the side with the fields beside them, as settings pages do, and stack on a phone.
 * Wrap the page's sections in a form, or give each its own.
 */
function FormSection({
  title,
  description,
  titleAs: Title = "h2",
  children,
  footer,
  layout = "split",
  variant = "plain",
  divided = false,
  className,
  classNames,
  id,
  ...props
}: FormSectionProps) {
  const generatedId = React.useId()
  const titleId = `${id ?? generatedId}-title`
  const card = variant === "card"

  return (
    <section
      id={id}
      data-slot="form-section"
      aria-labelledby={titleId}
      className={cn(
        "grid gap-x-10 gap-y-5",
        layout === "split" && "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
        divided && "border-t pt-8",
        className
      )}
      {...props}
    >
      <div className={cn("grid content-start gap-1.5", classNames?.header)}>
        <Title id={titleId} className={cn("font-heading text-base font-medium tracking-tight text-balance", classNames?.title)}>
          {title}
        </Title>
        {description && <p className={cn("max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground", classNames?.description)}>{description}</p>}
      </div>
      <div className={cn(card && "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs")}>
        <div className={cn("grid gap-5", card && "p-5 sm:p-6", classNames?.content)}>{children}</div>
        {footer && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2",
              card ? "border-t bg-muted/40 px-5 py-3 sm:px-6" : "mt-5",
              classNames?.footer
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </section>
  )
}

export { FormSection, type FormSectionProps }
