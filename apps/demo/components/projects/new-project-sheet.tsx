"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Combobox } from "@dashral/ui/components/combobox"
import { DatePicker } from "@dashral/ui/components/date-picker"
import { Input } from "@dashral/ui/components/input"
import { MultiSelect } from "@dashral/ui/components/multi-select"
import { MoneyInput } from "@dashral/ui/components/number-input"
import { Sheet } from "@dashral/ui/components/sheet"
import { TagInput } from "@dashral/ui/components/tag-input"
import { toast } from "@dashral/ui/components/toast"

import { labels, people, type Label, type Project } from "@/lib/projects-data"

const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/** "New project": a sheet with the form; the project joins the table at the top. */
export function NewProjectSheet({ onCreate }: { onCreate: (project: Omit<Project, "id">) => void }) {
  const t = useTranslations("projects")
  const [open, setOpen] = useState(false)
  const [owner, setOwner] = useState<string>("olivia")
  const [due, setDue] = useState<Date | undefined>(new Date(2026, 11, 1))
  const [chosen, setChosen] = useState<string[]>(["web"])
  const [budget, setBudget] = useState<number | null>(20000)
  const [deliverables, setDeliverables] = useState<string[]>([])
  const [error, setError] = useState<string>()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    if (!name) return setError(t("new.nameRequired"))
    onCreate({
      name,
      client: String(data.get("client") ?? "").trim() || t("new.internal"),
      stage: "brief",
      health: "onTrack",
      progress: 0,
      owner,
      due: due ? isoDay(due) : "2026-12-01",
      labels: chosen as Label[],
      budget: budget ?? 0,
    })
    toast.success(t("new.created", { name }), { description: deliverables.length ? t("new.withDeliverables", { count: deliverables.length }) : undefined })
    setOpen(false)
    setError(undefined)
    setDeliverables([])
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm">
          <Plus /> {t("new.button")}
        </Button>
      }
      title={t("new.title")}
      description={t("new.description")}
      className="w-full sm:max-w-md"
      classNames={{ body: "space-y-4 p-4", footer: "border-t" }}
      form={{ onSubmit: submit, noValidate: true }}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("new.cancel")}
          </Button>
          <Button type="submit">{t("new.create")}</Button>
        </div>
      }
    >
      <Input name="name" label={t("new.name")} placeholder={t("new.namePlaceholder")} error={error} withAsterisk autoFocus />
      <Input name="client" label={t("new.client")} placeholder="Northwind" />
      <Combobox
        label={t("table.owner")}
        value={owner}
        onValueChange={(value) => value && setOwner(value)}
        options={people.map((person) => ({ value: person.id, label: person.name, description: t(`roles.${person.role}`) }))}
        searchPlaceholder={t("new.searchPeople")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker label={t("table.due")} value={due} onValueChange={setDue} disabledDays={{ before: new Date(2026, 9, 19) }} />
        <MoneyInput label={t("details.budget")} currency="USD" value={budget} onValueChange={setBudget} min={0} step={1000} />
      </div>
      <MultiSelect
        label={t("table.labels")}
        value={chosen}
        onValueChange={setChosen}
        options={labels.map((value) => ({ value, label: t(`labels.${value}`) }))}
      />
      <TagInput
        label={t("new.deliverables")}
        description={t("new.deliverablesHint")}
        value={deliverables}
        onValueChange={setDeliverables}
        maxTags={8}
        placeholder={t("new.deliverablesPlaceholder")}
      />
    </Sheet>
  )
}
