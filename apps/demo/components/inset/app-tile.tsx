import { CreditCard, Database, Mail, MessageSquare, Smartphone, Wallet, Warehouse, Webhook } from "lucide-react"
import { cn } from "@dashral/ui/lib/utils"

import { GitHubIcon } from "@/components/icons"
import type { Integration } from "@/lib/inset-data"

// Each app's tile: an icon on a soft tint of its own color (Slack's is solid, like its brand), readable in both themes.
const tiles: Record<Integration["id"], { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  slack: { icon: MessageSquare, className: "bg-[#4a154b] text-white" },
  email: { icon: Mail, className: "bg-[oklch(0.93_0.03_245)] text-[oklch(0.42_0.1_245)] dark:bg-[oklch(0.3_0.05_245)] dark:text-[oklch(0.85_0.07_245)]" },
  push: { icon: Smartphone, className: "bg-[oklch(0.93_0.03_160)] text-[oklch(0.42_0.08_160)] dark:bg-[oklch(0.3_0.04_160)] dark:text-[oklch(0.85_0.07_160)]" },
  stripe: { icon: CreditCard, className: "bg-[oklch(0.93_0.04_280)] text-[oklch(0.45_0.17_280)] dark:bg-[oklch(0.3_0.07_280)] dark:text-[oklch(0.85_0.09_280)]" },
  paypal: { icon: Wallet, className: "bg-[oklch(0.93_0.03_250)] text-[oklch(0.4_0.12_255)] dark:bg-[oklch(0.3_0.05_250)] dark:text-[oklch(0.85_0.07_250)]" },
  postgres: { icon: Database, className: "bg-[oklch(0.93_0.03_235)] text-[oklch(0.42_0.09_235)] dark:bg-[oklch(0.3_0.05_235)] dark:text-[oklch(0.85_0.06_235)]" },
  bigquery: { icon: Warehouse, className: "bg-[oklch(0.94_0.04_80)] text-[oklch(0.48_0.11_70)] dark:bg-[oklch(0.32_0.05_80)] dark:text-[oklch(0.86_0.09_80)]" },
  github: { icon: GitHubIcon, className: "bg-muted text-foreground" },
  webhooks: { icon: Webhook, className: "bg-[oklch(0.93_0.04_15)] text-[oklch(0.48_0.15_20)] dark:bg-[oklch(0.3_0.06_15)] dark:text-[oklch(0.85_0.08_15)]" },
}

export function AppTile({ app, size = "md", className }: { app: Integration["id"]; size?: "sm" | "md" | "lg"; className?: string }) {
  const { icon: Icon, className: colors } = tiles[app]
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "sm" && "size-8 rounded-lg [&_svg]:size-4",
        size === "md" && "size-10 rounded-xl [&_svg]:size-[18px]",
        size === "lg" && "size-12 rounded-2xl [&_svg]:size-[22px]",
        colors,
        className
      )}
    >
      <Icon />
    </span>
  )
}
