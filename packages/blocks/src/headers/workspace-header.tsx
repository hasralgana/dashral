"use client"

import { useState } from "react"
import { Bell, ChevronsUpDown, CircleHelp, CreditCard, LogOut, MessageSquare, Plus, Settings, User } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { indicatorMotion, useIndicator } from "@dashral/ui/lib/use-indicator"
import { cn } from "@dashral/ui/lib/utils"

export type Workspace = { id: string; name: string; plan?: string; /** Its tile's color class, e.g. "bg-primary". */ color: string }
export type Project = { id: string; name: string; /** Its status dot's color class, e.g. "bg-success". */ status: string }
export type Section = { label: string; href?: string }
/** What the account menu and the workspace and project menus can ask for. */
export type HeaderAction = "create-workspace" | "workspace-settings" | "new-project" | "feedback" | "help" | "notifications" | "profile" | "billing" | "sign-out"

const sampleWorkspaces: Workspace[] = [
  { id: "acme", name: "Acme Inc", plan: "Team", color: "bg-primary" },
  { id: "marketing", name: "Acme Marketing", plan: "Pro", color: "bg-highlight" },
  { id: "personal", name: "Olivia's projects", plan: "Free", color: "bg-success" },
]

const sampleProjects: Project[] = [
  { id: "website", name: "Website", status: "bg-success" },
  { id: "mobile", name: "Mobile app", status: "bg-warning" },
  { id: "api", name: "Public API", status: "bg-success" },
]

const sampleSections: Section[] = ["Overview", "Analytics", "Customers", "Reports", "Settings"].map((label) => ({ label }))

/** A workspace's initial on its own color. */
function WorkspaceTile({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold text-white", color, className)}>
      {name[0]}
    </span>
  )
}

/**
 * Two rows: the workspace and project switchers with help, notifications and the account menu on top, and the
 * section's tabs underneath, with an underline that slides to the one you pick. Every part comes from props: what's
 * picked can be controlled, and every menu item and button tells `onAction`.
 */
export function WorkspaceHeader({
  workspaces = sampleWorkspaces,
  workspace: workspaceProp,
  onWorkspaceChange,
  projects = sampleProjects,
  project: projectProp,
  onProjectChange,
  sections = sampleSections,
  section: sectionProp,
  onSectionChange,
  user = { name: "Olivia Martin", email: "olivia@acme.com", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  notifications = 2,
  onAction,
}: {
  workspaces?: Workspace[]
  /** The workspace picked, by id (the header keeps it without it). */
  workspace?: string
  onWorkspaceChange?: (id: string) => void
  /** The projects in it; none hides the project switcher. */
  projects?: Project[]
  project?: string
  onProjectChange?: (id: string) => void
  /** The tabs underneath: links (href), or picked in place (onSectionChange); none hides the row. */
  sections?: Section[]
  section?: string
  onSectionChange?: (label: string) => void
  user?: { name: string; email: string; src?: string }
  /** Unread notifications: a dot on the bell when there are any. */
  notifications?: number
  onAction?: (action: HeaderAction) => void
}) {
  const [ownWorkspace, setOwnWorkspace] = useState(workspaces[0]?.id ?? "")
  const [ownProject, setOwnProject] = useState(projects[0]?.id ?? "")
  const [ownSection, setOwnSection] = useState(sections[0]?.label ?? "")
  const workspaceId = workspaceProp ?? ownWorkspace
  const projectId = projectProp ?? ownProject
  const section = sectionProp ?? ownSection
  const setWorkspaceId = (id: string) => {
    setOwnWorkspace(id)
    onWorkspaceChange?.(id)
  }
  const setProjectId = (id: string) => {
    setOwnProject(id)
    onProjectChange?.(id)
  }
  const [navRef, underline] = useIndicator<HTMLElement>("[aria-current=page]")
  const workspace = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]!
  const project = projects.find((p) => p.id === projectId) ?? projects[0]

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        <DropdownMenu
          align="start"
          className="w-64"
          trigger={
            <Button variant="ghost" className="-ms-2 gap-2 px-2">
              <WorkspaceTile name={workspace.name} color={workspace.color} />
              <span className="max-w-32 truncate font-medium sm:max-w-none">{workspace.name}</span>
              {workspace.plan && (
                <Badge variant="soft" color="neutral" className="hidden rounded-full px-1.5 py-px text-[10px] sm:inline-flex">
                  {workspace.plan}
                </Badge>
              )}
              <ChevronsUpDown className="text-muted-foreground" aria-hidden />
            </Button>
          }
          items={[
            { type: "label", label: "Workspaces" },
            {
              type: "radio",
              value: workspaceId,
              onValueChange: setWorkspaceId,
              options: workspaces.map((w) => ({
                value: w.id,
                label: (
                  <span className="flex flex-1 items-center gap-2">
                    {w.name}
                    <span className="ms-auto text-xs text-muted-foreground">{w.plan}</span>
                  </span>
                ),
                icon: <WorkspaceTile name={w.name} color={w.color} className="size-5 text-[10px]" />,
              })),
            },
            { type: "separator" },
            { label: "Create a workspace", icon: <Plus />, onSelect: () => onAction?.("create-workspace") },
            { label: "Workspace settings", icon: <Settings />, onSelect: () => onAction?.("workspace-settings") },
          ]}
        />

        {project && (
          <>
            <span aria-hidden className="hidden text-lg font-light text-border sm:inline">
              /
            </span>

            <DropdownMenu
              align="start"
              className="w-56"
              trigger={
                <Button variant="ghost" className="hidden gap-2 px-2 sm:inline-flex">
                  <span aria-hidden className={cn("size-2 rounded-full", project.status)} />
                  {project.name}
                  <ChevronsUpDown className="text-muted-foreground" aria-hidden />
                </Button>
              }
              items={[
                { type: "label", label: "Projects" },
                {
                  type: "radio",
                  value: projectId,
                  onValueChange: setProjectId,
                  options: projects.map((p) => ({ value: p.id, label: p.name, icon: <span aria-hidden className={cn("size-2 rounded-full", p.status)} /> })),
                },
                { type: "separator" },
                { label: "New project", icon: <Plus />, onSelect: () => onAction?.("new-project") },
              ]}
            />
          </>
        )}

        <div className="ms-auto flex items-center gap-1">
          <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => onAction?.("feedback")}>
            <MessageSquare aria-hidden /> Feedback
          </Button>
          <Tooltip content="Help and docs">
            <Button variant="ghost" size="icon" aria-label="Help and docs" onClick={() => onAction?.("help")}>
              <CircleHelp />
            </Button>
          </Tooltip>
          <Tooltip content="Notifications">
            <Button
              variant="ghost"
              size="icon"
              aria-label={notifications ? `Notifications, ${notifications} unread` : "Notifications"}
              className="relative"
              onClick={() => onAction?.("notifications")}
            >
              <Bell />
              {notifications > 0 && <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />}
            </Button>
          </Tooltip>
          <DropdownMenu
            align="end"
            className="w-56"
            trigger={
              <button type="button" aria-label="Account" className="ms-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <Avatar name={user.name} src={user.src} size="md" />
              </button>
            }
            items={[
              {
                type: "label",
                label: (
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </span>
                ),
              },
              { type: "separator" },
              { label: "Profile", icon: <User />, onSelect: () => onAction?.("profile") },
              { label: "Billing", icon: <CreditCard />, onSelect: () => onAction?.("billing") },
              { type: "separator" },
              { label: "Sign out", icon: <LogOut />, color: "destructive", onSelect: () => onAction?.("sign-out") },
            ]}
          />
        </div>
      </div>

      {/* The section's pages: an underline slides to the one you're on. Scrolls sideways on phones. */}
      {sections.length > 0 && (
        <nav ref={navRef} aria-label="Workspace" className="relative flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
          {underline && (
            <span
              aria-hidden
              className={cn(indicatorMotion, "h-0.5 rounded-full bg-foreground")}
              style={{ translate: `${underline.x + 8}px ${underline.y + underline.height - 2}px`, width: underline.width - 16 }}
            />
          )}
          {sections.map(({ label: name, href }) => (
            <a
              key={name}
              href={href ?? "#"}
              onClick={(event) => {
                if (!href) event.preventDefault()
                setOwnSection(name)
                onSectionChange?.(name)
              }}
              aria-current={section === name ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-3 text-sm font-medium transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                section === name ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {name}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
