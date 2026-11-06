"use client"

import Link from "next/link"
import { CreditCard, LogOut, Settings, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"

import { account } from "@/lib/account"
import { signOut } from "@/lib/sign-in"
import { useTemplateHref } from "@/lib/use-template"

export function UserNav() {
  const t = useTranslations("layout")
  const nav = useTranslations("nav")
  const href = useTemplateHref()
  return (
    <DropdownMenu
      trigger={
        <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={t("accountMenu")}>
          <Avatar
            src="https://randomuser.me/api/portraits/women/68.jpg"
            name={account.name}
            size="md"
            classNames={{ fallback: "bg-primary/15 text-primary-text" }}
          />
        </button>
      }
      align="end"
      className="w-56"
      linkAs={Link}
      items={[
        {
          type: "label",
          label: (
            <>
              <p className="text-sm font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">{account.email}</p>
            </>
          ),
          className: "font-normal",
        },
        { type: "separator" },
        { href: href("/settings"), label: t("profile"), icon: <User /> },
        // @dashral-if demo
        { href: href("/pricing"), label: t("billing"), icon: <CreditCard /> },
        // @dashral-end
        { href: href("/settings?tab=account"), label: nav("settings"), icon: <Settings /> },
        { type: "separator" },
        // Where Sign out goes: lib/sign-in.ts.
        { href: signOut.href, label: t("signOut"), icon: <LogOut /> },
      ]}
    />
  )
}
