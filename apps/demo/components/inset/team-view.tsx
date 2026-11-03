"use client"

import { useState } from "react"
import { MoreHorizontal, RotateCw, UserMinus, UserPlus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Dialog, DialogClose } from "@dashral/ui/components/dialog"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Input } from "@dashral/ui/components/input"
import { Select } from "@dashral/ui/components/select"
import { toast } from "@dashral/ui/components/toast"

import { PanelCard } from "@/components/inset/panel-card"
import { PageHeader } from "@/components/page-header"
import { localeInfo, type Locale } from "@/lib/i18n"
import { members as initialMembers, workspacePlan, type Member, type MemberRole } from "@/lib/inset-data"

const roles: MemberRole[] = ["admin", "member", "billing"]
// The demo's "now", like the activity feed's: the page reads the same on every visit.
const now = Date.parse("2026-10-19T10:00:00Z")
const seats = workspacePlan.usage.find((u) => u.key === "seats")!.limit

export function TeamView() {
  const t = useTranslations("inset.team")
  const intl = localeInfo[useLocale() as Locale].intl
  const [members, setMembers] = useState(initialMembers)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberRole>("member")
  const [error, setError] = useState<string | null>(null)

  const ago = (iso: string) => {
    const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" })
    const hours = Math.round((Date.parse(iso) - now) / 36e5)
    return Math.abs(hours) < 24 ? rtf.format(hours, "hour") : rtf.format(Math.round(hours / 24), "day")
  }

  function changeRole(member: Member, next: MemberRole) {
    setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, role: next } : m)))
    toast.success(t("roleChanged", { name: member.name, role: t(`roles.${next}`) }))
  }

  function remove(member: Member) {
    setMembers((list) => list.filter((m) => m.id !== member.id))
    toast.success(t("removed", { name: member.name }))
  }

  function openInvite(open: boolean) {
    setInviting(open)
    if (open) {
      setEmail("")
      setRole("member")
      setError(null)
    }
  }

  function invite(event: React.FormEvent) {
    event.preventDefault()
    const address = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return setError(t("invalidEmail"))
    if (members.some((m) => m.email === address)) return setError(t("alreadyIn", { email: address }))
    const name = address.split("@")[0]!.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    setMembers((list) => [...list, { id: `mem_${Date.now()}`, name, email: address, role, lastActive: null }])
    setInviting(false)
    toast.success(t("invited", { email: address }))
  }

  const pending = members.filter((m) => !m.lastActive).length

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <PanelCard
        title={t("members")}
        info={t("membersInfo")}
        legend={[
          { color: "neutral", label: t("seats", { used: members.length, total: seats }) },
          { color: "info", value: pending, label: t("pending") },
        ]}
        actions={
          <Button size="sm" onClick={() => openInvite(true)}>
            <UserPlus /> {t("invite")}
          </Button>
        }
      >
        <ul className="divide-y divide-divider">
          {members.map((member) => {
            const owner = member.role === "owner"
            return (
              // On phones the name takes the row and the controls go under it.
              <li key={member.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
                <div className="flex min-w-0 basis-full items-center gap-3 sm:basis-auto sm:flex-1">
                  <Avatar name={member.name} alt="" size="md" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{member.name}</span>
                      {owner && <Badge variant="soft" color="neutral">{t("you")}</Badge>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground max-sm:flex-1 sm:w-36">
                  {member.lastActive ? (
                    t("lastActive", { time: ago(member.lastActive) })
                  ) : (
                    <Badge variant="soft" color="info">{t("pending")}</Badge>
                  )}
                </span>
                <Select
                  size="sm"
                  aria-label={t("roleFor", { name: member.name })}
                  value={member.role}
                  onValueChange={(value) => changeRole(member, value as MemberRole)}
                  disabled={owner}
                  options={(owner ? (["owner"] as MemberRole[]) : roles).map((value) => ({ value, label: t(`roles.${value}`) }))}
                  className="w-32"
                />
                <div className="w-8">
                  {!owner && (
                    <DropdownMenu
                      align="end"
                      className="w-52"
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={t("actionsFor", { name: member.name })}>
                          <MoreHorizontal />
                        </Button>
                      }
                      items={[
                        ...(member.lastActive
                          ? []
                          : [{ label: t("resend"), icon: <RotateCw />, onSelect: () => toast.success(t("resent", { email: member.email })) }]),
                        { label: t("remove"), icon: <UserMinus />, color: "destructive" as const, onSelect: () => remove(member) },
                      ]}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </PanelCard>

      <Dialog
        open={inviting}
        onOpenChange={openInvite}
        title={t("inviteTitle")}
        description={t("inviteDescription")}
        form={{ onSubmit: invite, noValidate: true }}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button type="submit">{t("send")}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("email")}
            type="email"
            autoComplete="off"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            error={error ?? undefined}
            autoFocus
          />
          <Select
            label={t("role")}
            value={role}
            onValueChange={(value) => setRole(value as MemberRole)}
            options={roles.map((value) => ({ value, label: t(`roles.${value}`) }))}
          />
        </div>
      </Dialog>
    </>
  )
}
