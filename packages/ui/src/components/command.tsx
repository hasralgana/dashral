"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Dialog } from "./dialog"

/** Building block: the root, for a list of your own (Combobox and MultiSelect are built from these). */
function CommandRoot({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

type CommandAction = {
  label: React.ReactNode
  /** What the search matches; the label when it's text. */
  value?: string
  /** More words that find it, e.g. synonyms. */
  keywords?: string[]
  icon?: React.ReactNode
  /**
   * The keys that do the same, shown at the end: text such as "⌘S", or key caps, e.g. a sequence pressed one after the
   * other as <><Kbd size="sm">G</Kbd><Kbd size="sm">O</Kbd></>.
   */
  shortcut?: React.ReactNode
  /** At the end instead of a shortcut, e.g. a "Pro" badge. */
  badge?: React.ReactNode
  disabled?: boolean
  onSelect?: () => void
}

type CommandSection = { heading?: React.ReactNode; items: CommandAction[] }

type CommandProps = Omit<React.ComponentProps<typeof CommandPrimitive>, "children"> & {
  groups: CommandSection[]
  placeholder?: string
  /** Shown when nothing matches. */
  emptyText?: React.ReactNode
}

function CommandBody({ groups, placeholder, emptyText }: Pick<CommandProps, "groups" | "placeholder" | "emptyText">) {
  return (
    <>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        {groups.map((group, g) => (
          <React.Fragment key={g}>
            {g > 0 && !group.heading && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item, i) => (
                <CommandItem
                  key={i}
                  value={item.value ?? (typeof item.label === "string" ? item.label : undefined)}
                  keywords={item.keywords}
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                >
                  {item.icon}
                  {item.label}
                  {item.badge ? <span className="ms-auto">{item.badge}</span> : item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </>
  )
}

/** A searchable list of actions on the page, in one tag: groups of items with icons and shortcuts. */
function Command({ groups, placeholder: placeholderProp, emptyText: emptyTextProp, className, ...props }: CommandProps) {
  const { t } = useLocale()
  const placeholder = placeholderProp ?? t("search")
  const emptyText = emptyTextProp ?? t("noResults")
  return (
    <CommandRoot className={cn("rounded-lg border shadow-md", className)} {...props}>
      <CommandBody groups={groups} placeholder={placeholder} emptyText={emptyText} />
    </CommandRoot>
  )
}

type CommandDialogProps = Omit<React.ComponentProps<typeof Dialog>, "title" | "children" | "footer" | "form"> & {
  groups: CommandSection[]
  placeholder?: string
  emptyText?: React.ReactNode
  /** Read out when it opens; not shown. */
  title?: string
  description?: string
}

/** A command palette: the same list in a dialog, e.g. on ⌘K. Open it with open / onOpenChange or a trigger. */
function CommandDialog({
  groups,
  placeholder: placeholderProp,
  emptyText: emptyTextProp,
  title: titleProp,
  description: descriptionProp,
  className,
  ...props
}: CommandDialogProps) {
  const { t } = useLocale()
  const description = descriptionProp ?? t("commandDescription")
  const title = titleProp ?? t("commandTitle")
  const emptyText = emptyTextProp ?? t("noResults")
  const placeholder = placeholderProp ?? t("commandPlaceholder")
  return (
    <Dialog
      title={title}
      description={description}
      showCloseButton={false}
      className={cn("top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
      classNames={{ header: "sr-only" }}
      {...props}
    >
      <CommandRoot className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
        <CommandBody groups={groups} placeholder={placeholder} emptyText={emptyText} />
      </CommandRoot>
    </Dialog>
  )
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" cmdk-input-wrapper="" className="flex h-10 items-center gap-2 border-b px-3">
      <SearchIcon className="size-4 shrink-0 opacity-50" aria-hidden />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  )
}

function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm text-muted-foreground" {...props} />
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("-mx-1 h-px bg-border", className)} {...props} />
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ms-auto flex items-center gap-1 text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandRoot,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  type CommandProps,
  type CommandDialogProps,
  type CommandAction,
  type CommandSection,
}
