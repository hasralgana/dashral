"use client"

import { useState } from "react"
import { ChevronDown, ChevronsUpDown, CircleHelp, Columns3, FileText, Inbox, ListTodo, Menu, Plus, Search, SquarePen, Star, UserPlus, X } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { CommandDialog } from "@dashral/ui/components/command"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Sheet, SheetClose } from "@dashral/ui/components/sheet"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

/** A workspace in the switcher; `tile` is the classes of its letter tile. */
export type Workspace = { id: string; name: string; initials?: string; tile?: string }
/** A project; `color` is the class of its square. */
export type WorkspaceProject = { id: string; name: string; color: string }
export type WorkspaceView = { id: string; label: string; icon: React.ReactNode }
/** A starred page: `to` is where it goes, a page id like the sidebar's own ("q4/board"). */
export type WorkspaceFavorite = { to: string; label: string }
/** The buttons that don't navigate. */
export type WorkspaceAction = "new-issue" | "create-workspace" | "invite" | "help"

const sampleWorkspaces: Workspace[] = [
  { id: "acme", name: "Acme Inc.", initials: "A", tile: "bg-primary text-primary-foreground" },
  { id: "nusantara", name: "PT Nusantara", initials: "N", tile: "bg-success text-success-foreground" },
]
const sampleProjects: WorkspaceProject[] = [
  { id: "web", name: "Website", color: "bg-info" },
  { id: "mobile", name: "Mobile app", color: "bg-highlight" },
  { id: "q4", name: "Q4 launch", color: "bg-warning" },
]
const sampleFavorites: WorkspaceFavorite[] = [
  { to: "q4/board", label: "Q4 launch board" },
  { to: "web/docs", label: "Website specs" },
]
const colors = ["bg-info", "bg-highlight", "bg-success", "bg-warning", "bg-destructive"]
const sampleViews: WorkspaceView[] = [
  { id: "issues", label: "Issues", icon: <ListTodo /> },
  { id: "board", label: "Board", icon: <Columns3 /> },
  { id: "docs", label: "Docs", icon: <FileText /> },
]

/** A titled part of the sidebar that folds away, its height easing open and closed. */
function Section({
  label,
  expanded,
  onToggle,
  action,
  children,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mt-4">
      <div className="group flex items-center">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex h-7 flex-1 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {label}
          <ChevronDown aria-hidden className={cn("size-3 transition-transform duration-(--duration-standard) ease-standard", !expanded && "-rotate-90 rtl:rotate-90")} />
        </button>
        {action}
      </div>
      <div
        inert={!expanded || undefined}
        className="grid transition-[grid-template-rows] duration-(--duration-standard) ease-standard motion-reduce:transition-none"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <ul className="grid min-h-0 gap-0.5 overflow-hidden">{children}</ul>
      </div>
    </div>
  )
}

/**
 * A project tool's sidebar, like Linear's or Notion's: the workspace switcher and new-item button, search, your inbox
 * and issues, then Favorites and Projects that fold away. Each project opens to its views, and + adds one. Replace
 * your workspaces, projects, views and favorites through props. Pages are ids: "inbox", "mine" and "<project>/<view>";
 * the one you're on is controllable, with `onNavigate`. + calls `onAddProject`, which may return the stored project.
 */
export function WorkspaceSidebar({
  workspaces = sampleWorkspaces,
  workspace: workspaceProp,
  onWorkspaceChange,
  projects: projectsProp = sampleProjects,
  views = sampleViews,
  favorites = sampleFavorites,
  inbox = 4,
  current: currentProp,
  onNavigate,
  onAddProject,
  onAction,
}: {
  workspaces?: Workspace[]
  /** The workspace you're in, by id (the sidebar keeps it without it). */
  workspace?: string
  onWorkspaceChange?: (id: string) => void
  projects?: WorkspaceProject[]
  /** The views every project opens to. */
  views?: WorkspaceView[]
  favorites?: WorkspaceFavorite[]
  /** The count beside Inbox; 0 hides it. */
  inbox?: number
  current?: string
  onNavigate?: (page: string) => void
  /** Called with the new project; return the one you stored (its real id) or throw to take it back. */
  onAddProject?: (project: WorkspaceProject) => WorkspaceProject | void | Promise<WorkspaceProject | void>
  onAction?: (action: WorkspaceAction) => void
}) {
  const [ownWorkspace, setOwnWorkspace] = useState(workspaces[0]?.id ?? "")
  const workspace = workspaceProp ?? ownWorkspace
  const setWorkspace = (id: string) => {
    setOwnWorkspace(id)
    onWorkspaceChange?.(id)
  }
  // Your projects, re-read when you pass new ones.
  const [projects, setProjects] = useState(projectsProp)
  const [lastProjects, setLastProjects] = useState(projectsProp)
  if (projectsProp !== lastProjects) {
    setLastProjects(projectsProp)
    setProjects(projectsProp)
  }
  const first = projects[0] ? `${projects[0].id}/${views[1]?.id ?? views[0]?.id}` : "inbox"
  const [ownCurrent, setOwnCurrent] = useState(first)
  const current = currentProp ?? ownCurrent
  const [open, setOpen] = useState<string[]>(["favorites", "projects", first.split("/")[0]!])
  const [search, setSearch] = useState(false)
  const [navRef, highlight] = useIndicator<HTMLElement>("[aria-current=page]")
  const active = workspaces.find((w) => w.id === workspace) ?? workspaces[0] ?? { id: "", name: "" }
  const tile = (w: Workspace) => w.tile ?? "bg-primary text-primary-foreground"

  const toggle = (id: string) => setOpen(open.includes(id) ? open.filter((o) => o !== id) : [...open, id])
  const row =
    "relative flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:text-foreground aria-[current=page]:font-medium [&>svg]:size-4 [&>svg]:shrink-0"
  const link = (id: string, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <button type="button" aria-current={current === id ? "page" : undefined} onClick={() => pick(id)} className={row}>
      {icon}
      <span className="flex-1 truncate text-start">{label}</span>
      {extra}
    </button>
  )

  const [sheet, setSheet] = useState(false)
  const pick = (id: string) => {
    setOwnCurrent(id)
    onNavigate?.(id)
    setSheet(false)
  }

  async function addProject() {
    const draft = { id: `p${Date.now()}`, name: "Untitled project", color: colors[projects.length % colors.length]! }
    const before = projects
    setProjects([...projects, draft])
    setOpen([...open, "projects", draft.id])
    try {
      const stored = (await onAddProject?.(draft)) || draft
      if (stored !== draft) setProjects((list) => list.map((p) => (p.id === draft.id ? stored : p)))
      setOpen((list) => [...list, stored.id])
      pick(`${stored.id}/${views[0]?.id}`)
    } catch {
      setProjects(before)
    }
  }

  // In the sheet, its close button sits in the top row with the others (the sheet's own would cover New issue).
  const body = (inSheet: boolean) => (
    <>
      <div className="flex items-center gap-1 p-3 pb-2">
        <DropdownMenu
          align="start"
          className="w-56"
          trigger={
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1.5 text-start outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent"
            >
              <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold", tile(active))}>
                {active.initials ?? active.name[0]}
              </span>
              <span className="truncate text-sm font-semibold">{active.name}</span>
              <ChevronsUpDown className="ms-auto size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          }
          items={[
            {
              type: "radio",
              value: workspace,
              onValueChange: setWorkspace,
              options: workspaces.map((w) => ({
                value: w.id,
                label: w.name,
                icon: (
                  <span aria-hidden className={cn("flex size-5 items-center justify-center rounded text-[10px] font-bold", tile(w))}>
                    {w.initials ?? w.name[0]}
                  </span>
                ),
              })),
            },
            { type: "separator" },
            { label: "Create workspace", icon: <Plus />, onSelect: () => onAction?.("create-workspace") },
          ]}
        />
        <Button variant="ghost" size="icon-sm" aria-label="New issue" onClick={() => onAction?.("new-issue")} className="text-muted-foreground">
          <SquarePen />
        </Button>
        {inSheet && (
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close the menu" className="text-muted-foreground">
              <X />
            </Button>
          </SheetClose>
        )}
      </div>

      <nav ref={navRef} aria-label="Workspace" className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {highlight && (
          <span
            aria-hidden
            className={cn(indicatorMotion, "rounded-md bg-sidebar-accent")}
            style={{ translate: `${highlight.x}px ${highlight.y}px`, width: highlight.width, height: highlight.height }}
          />
        )}
        <ul className="grid gap-0.5">
          <li>
            <button type="button" onClick={() => setSearch(true)} className={row}>
              <Search />
              <span className="flex-1 text-start">Search</span>
            </button>
          </li>
          <li>{link("inbox", "Inbox", <Inbox />, inbox > 0 && <span className="text-xs text-muted-foreground tabular-nums">{inbox}</span>)}</li>
          <li>{link("mine", "My issues", <ListTodo />)}</li>
        </ul>

        {favorites.length > 0 && (
          <Section label="Favorites" expanded={open.includes("favorites")} onToggle={() => toggle("favorites")}>
            {favorites.map((f) => (
              <li key={f.to}>{link(f.to, f.label, <Star className="fill-warning text-warning" />)}</li>
            ))}
          </Section>
        )}

        <Section
          label="Projects"
          expanded={open.includes("projects")}
          onToggle={() => toggle("projects")}
          action={
            <Button variant="ghost" size="icon-sm" aria-label="New project" onClick={addProject} className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100">
              <Plus />
            </Button>
          }
        >
          {projects.map((project) => {
            const expanded = open.includes(project.id)
            return (
              <li key={project.id}>
                <button type="button" aria-expanded={expanded} onClick={() => toggle(project.id)} className={cn(row, current.startsWith(`${project.id}/`) && !expanded && "text-foreground")}>
                  <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", project.color)} />
                  <span className="flex-1 truncate text-start">{project.name}</span>
                  <ChevronDown aria-hidden className={cn("size-3.5 transition-transform duration-(--duration-standard) ease-standard", !expanded && "-rotate-90 rtl:rotate-90")} />
                </button>
                <div
                  inert={!expanded || undefined}
                  className="grid transition-[grid-template-rows] duration-(--duration-standard) ease-standard motion-reduce:transition-none"
                  style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                >
                  <ul className="ms-3 grid min-h-0 overflow-hidden border-s ps-2">
                    {views.map((view) => (
                      // The space sits on each row, so a closed list has no height at all (no stub of its line).
                      <li key={view.id} className="pt-0.5">
                        {link(`${project.id}/${view.id}`, view.label, view.icon)}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </Section>
      </nav>

      <div className="grid gap-0.5 border-t p-3">
        <button type="button" onClick={() => onAction?.("invite")} className={row}>
          <UserPlus />
          Invite people
        </button>
        <button type="button" onClick={() => onAction?.("help")} className={row}>
          <CircleHelp />
          Help and support
        </button>
      </div>

      <CommandDialog
        open={search}
        onOpenChange={setSearch}
        placeholder="Search projects and views…"
        groups={[
          {
            heading: "Projects",
            items: projects.flatMap((project) =>
              views.map((view) => ({
                label: `${project.name} · ${view.label}`,
                icon: view.icon,
                onSelect: () => {
                  setOpen([...new Set([...open, "projects", project.id])])
                  pick(`${project.id}/${view.id}`)
                  setSearch(false)
                },
              }))
            ),
          },
        ]}
      />
    </>
  )

  return (
    <>
      {/* Phones: a top bar, and the same sidebar in a sheet. */}
      <div className="flex h-14 items-center gap-3 border-b bg-sidebar px-4 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open the menu" onClick={() => setSheet(true)}>
          <Menu />
        </Button>
        <span className="truncate text-sm font-semibold">{active.name}</span>
      </div>
      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        side="left"
        title="Menu"
        padding="none"
        showCloseButton={false}
        className="w-72 bg-sidebar"
        classNames={{ header: "sr-only", body: "flex flex-col" }}
      >
        {sheet && body(true)}
      </Sheet>
      <aside aria-label="Sidebar" className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-e bg-sidebar md:flex">
        {!sheet && body(false)}
      </aside>
    </>
  )
}
