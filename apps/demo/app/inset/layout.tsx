// @dashral-if customizer
import { CustomizerDock } from "@/components/customizer/customizer-dock"
// @dashral-end
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SiteHeader } from "@/components/layout/site-header"
import { TemplateScope } from "@/components/layout/template-scope"

/**
 * The Inset template's frame: the sidebar and header share one surface, the shell, and the page sits on a rounded
 * panel inside it that scrolls on its own. Its colors are in app/layout-inset.css.
 */
export default function InsetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="inset-shell" className="flex h-svh overflow-hidden">
      <TemplateScope template="inset" />
      <aside
        data-sidebar-panel
        className="hidden h-svh w-64 shrink-0 transition-[width] duration-(--duration-standard) ease-standard motion-reduce:transition-none lg:block collapsed:w-16"
      >
        <SidebarNav variant="desktop" />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SiteHeader />
        {/* scroll-pt matches the padding: the router scrolls a new page to the top of the panel, padding included. */}
        <main
          data-slot="workspace"
          className="mx-2 mb-2 min-h-0 flex-1 scroll-pt-4 space-y-6 overflow-y-auto overscroll-contain rounded-[calc(var(--radius)+0.25rem)] border p-4 md:scroll-pt-6 md:p-6 lg:ms-0"
        >
          {children}
        </main>
      </div>
      {/* @dashral-if customizer */}
      {/* On the shell, like the sidebar: no edge of its own beside the page's panel. */}
      <CustomizerDock className="xl:data-[open]:border-s-0 xl:bg-transparent" />
      {/* @dashral-end */}
    </div>
  )
}
