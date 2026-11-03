// @dashral-if customizer
import { CustomizerDock } from "@/components/customizer/customizer-dock"
// @dashral-end
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SiteHeader } from "@/components/layout/site-header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside
        data-sidebar-panel
        className="sticky top-0 z-40 hidden h-svh w-64 shrink-0 border-e border-divider bg-sidebar transition-[width] duration-(--duration-standard) ease-standard motion-reduce:transition-none lg:block collapsed:w-16"
      >
        <SidebarNav variant="desktop" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="w-full flex-1 space-y-6 p-4 md:p-6">{children}</main>
      </div>
      {/* @dashral-if customizer */}
      <CustomizerDock />
      {/* @dashral-end */}
    </div>
  )
}
