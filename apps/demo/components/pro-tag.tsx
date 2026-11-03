import { Lock } from "lucide-react"
import { cn } from "@dashral/ui/lib/utils"

/**
 * Pro's colors: the primary's gradient (--gradient-from / via / to, three neighboring hues around it; silver for the
 * default ink, sky → blue → indigo for blue) as --tag-from / --tag-via / --tag-to, with its ink for the text. They follow the
 * customizer's color. Shared by the tag and the sidebar's Pro card.
 */
export const proColors =
  "text-(--gradient-ink) [--tag-from:var(--gradient-from)] [--tag-via:var(--gradient-via)] [--tag-to:var(--gradient-to)]"

/**
 * "Pro" beside a locked feature, in the website's tag style: a borderless pill with a faint tint of the primary's
 * gradient and its word in the gradient's ink, so a column of them stays calm. `locked` adds a padlock.
 */
export function ProTag({ label, locked = false, className }: { label: string; locked?: boolean; className?: string }) {
  return (
    <span
      data-slot="pro-tag"
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full border border-transparent px-1.5 text-[10px] font-medium tracking-[0.01em] whitespace-nowrap select-none",
        proColors,
        // A faint tint of the gradient over the surface, under the transparent border too: no hairline.
        "[background:linear-gradient(90deg,color-mix(in_oklab,var(--tag-from)_14%,var(--background)),color-mix(in_oklab,var(--tag-to)_14%,var(--background)))]",
        className
      )}
    >
      {locked && <Lock className="size-2.5" aria-hidden />}
      {label}
    </span>
  )
}

/** "Free" beside the logo in the free edition: the same pill as ProTag, quiet and neutral. */
export function FreeTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center rounded-full border px-1.5 text-[10px] font-medium tracking-[0.01em] whitespace-nowrap text-muted-foreground select-none",
        className
      )}
    >
      {label}
    </span>
  )
}
