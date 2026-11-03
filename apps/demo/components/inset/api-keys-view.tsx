"use client"

import { useState } from "react"
import { Check, Copy, KeyRound, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { CopyButton } from "@dashral/ui/components/copy-button"
import { Dialog, DialogClose } from "@dashral/ui/components/dialog"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { Input } from "@dashral/ui/components/input"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"
import { toast } from "@dashral/ui/components/toast"

import { PanelCard } from "@/components/inset/panel-card"
import { PageHeader } from "@/components/page-header"
import { apiKeys as initialKeys, insetToday, type ApiKey } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

/** A new secret: the mode's prefix and 32 random hex characters, from the browser's crypto. */
function generateKey(mode: "live" | "test") {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return `key_${mode}_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
}

export function ApiKeysView() {
  const t = useTranslations("inset.apiKeys")
  const format = useFormats()
  const [keys, setKeys] = useState(initialKeys)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [mode, setMode] = useState<"live" | "test">("live")
  const [error, setError] = useState<string | null>(null)
  // The new key, shown once after it's created.
  const [secret, setSecret] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  // The key just copied from the list, which shows a check for a moment.
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyKey(key: ApiKey) {
    void navigator.clipboard?.writeText(key.secret)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId((id) => (id === key.id ? null : id)), 1500)
    toast.success(t("keyCopied", { name: key.name }))
  }

  function openCreate(open: boolean) {
    setCreating(open)
    if (open) {
      setName("")
      setMode("live")
      setError(null)
      setSecret(null)
    }
  }

  function create(event: React.FormEvent) {
    event.preventDefault()
    if (secret) return setCreating(false)
    if (!name.trim()) return setError(t("nameRequired"))
    const key = generateKey(mode)
    setKeys((list) => [
      { id: `key_${Date.now()}`, name: name.trim(), prefix: `key_${mode}`, last4: key.slice(-4), secret: key, created: insetToday, lastUsed: null },
      ...list,
    ])
    setSecret(key)
  }

  function revoke() {
    if (!revoking) return
    setKeys((list) => list.filter((k) => k.id !== revoking.id))
    toast.success(t("revoked", { name: revoking.name }))
    setRevoking(null)
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button onClick={() => openCreate(true)}>
          <Plus /> {t("create")}
        </Button>
      </PageHeader>

      <PanelCard
        title={t("keys")}
        info={t("keysInfo")}
        legend={[
          { color: "success", value: keys.filter((k) => k.prefix === "key_live").length, label: t("live") },
          { color: "neutral", value: keys.filter((k) => k.prefix === "key_test").length, label: t("test") },
        ]}
      >
        {keys.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-4">{t("columns.name")}</TableHead>
                <TableHead>{t("columns.key")}</TableHead>
                <TableHead>{t("columns.created")}</TableHead>
                <TableHead>{t("columns.lastUsed")}</TableHead>
                <TableHead className="pe-4">
                  <span className="sr-only">{t("revoke")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="ps-4">
                    <span className="flex items-center gap-2 font-medium whitespace-nowrap">
                      {key.name}
                      {key.prefix === "key_test" && (
                        <Badge variant="outline" color="neutral">
                          {t("test")}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* The masked key copies the whole one; its icon shows on hover or focus, and always on touch screens. */}
                    <button
                      type="button"
                      onClick={() => copyKey(key)}
                      aria-label={t("copyKey", { name: key.name })}
                      className="group/key inline-flex items-center gap-1.5 rounded-md bg-muted py-1 ps-2 pe-1.5 font-mono text-xs whitespace-nowrap outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span dir="ltr">
                        {key.prefix}_••••{key.last4}
                      </span>
                      {copiedId === key.id ? (
                        <Check className="size-3.5 text-success-text" aria-hidden />
                      ) : (
                        <Copy
                          className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/key:opacity-100 group-focus-visible/key:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none"
                          aria-hidden
                        />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(key.created)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{key.lastUsed ? format.date(key.lastUsed) : t("never")}</TableCell>
                  <TableCell className="pe-4 text-end">
                    <Button variant="ghost" color="destructive" size="sm" onClick={() => setRevoking(key)} aria-label={t("revokeFor", { name: key.name })}>
                      {t("revoke")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            variant="plain"
            icon={<KeyRound />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            actions={
              <Button variant="outline" onClick={() => openCreate(true)}>
                <Plus /> {t("create")}
              </Button>
            }
            className="py-10"
          />
        )}
      </PanelCard>

      {/* Create, then show the key once with a way to copy it. */}
      <Dialog
        open={creating}
        onOpenChange={openCreate}
        title={secret ? t("shownOnce") : t("createTitle")}
        description={secret ? t("shownOnceDescription") : t("createDescription")}
        form={{ onSubmit: create, noValidate: true }}
        footer={
          secret ? (
            <Button type="submit">{t("done")}</Button>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="outline">{t("cancel")}</Button>
              </DialogClose>
              <Button type="submit">{t("generate")}</Button>
            </>
          )
        }
      >
        {secret ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1.5 ps-3">
            <code className="min-w-0 flex-1 truncate font-mono text-sm" dir="ltr">
              {secret}
            </code>
            <CopyButton value={secret} label={t("copy")} variant="outline" className="bg-card" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label={t("name")}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              error={error ?? undefined}
              autoFocus
            />
            <SegmentedControl
              label={t("mode")}
              value={mode}
              onValueChange={(value) => setMode(value as "live" | "test")}
              options={[
                { value: "live", label: t("live") },
                { value: "test", label: t("test") },
              ]}
            />
          </div>
        )}
      </Dialog>

      <Dialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={revoking ? t("revokeTitle", { name: revoking.name }) : ""}
        description={t("revokeDescription")}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button color="destructive" onClick={revoke}>
              {t("revoke")}
            </Button>
          </>
        }
      />
    </>
  )
}
