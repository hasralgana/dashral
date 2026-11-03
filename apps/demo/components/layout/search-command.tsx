"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Search } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { CommandDialog } from "@dashral/ui/components/command"

import { useTranslations } from "next-intl"

import { ProTag } from "@/components/pro-tag"
import { useNavGroups } from "@/lib/use-nav"

/** Header search: a ⌘K command palette over every page and component. */
export function SearchCommand() {
  const t = useTranslations("layout")
  const navGroups = useNavGroups()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Icon trigger on small screens, full search box from sm up. */}
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={t("search")} className="sm:hidden">
        <Search aria-hidden />
      </Button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-transparent pe-[5px] ps-3 text-sm sm:flex text-muted-foreground shadow-xs transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-start">{t("searchShort")}</span>
        {/* Set in the field with 5px on every side, its corners following the field's (its radius less 1px border + 5px). */}
        <kbd className="inline-flex h-6 items-center rounded-[max(0px,calc(var(--radius-md)-6px))] border bg-muted px-1.5 font-mono text-[11px] font-medium">⌘K</kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("search")}
        description={t("searchDescription")}
        placeholder={t("searchPlaceholder")}
        groups={[
          ...navGroups.map((group) => ({
            heading: group.label,
            items: group.items
              .filter((item) => !item.children)
              .map((item) => ({
                label: item.title,
                value: `${group.label} ${item.title}`,
                icon: <item.icon />,
                badge: item.pro && <ProTag label={t("pro")} />,
                onSelect: () => go(item.href),
              })),
          })),
          ...navGroups
            .flatMap((group) => group.items)
            .filter((item) => item.children)
            .map((item) => ({
              heading: item.title,
              items: item.children!.map((child) => ({
                label: child.title,
                value: `${item.title} ${child.title}`,
                icon: child.href === item.href ? <FileText /> : <item.icon />,
                onSelect: () => go(child.href),
              })),
            })),
        ]}
      />
    </>
  )
}
