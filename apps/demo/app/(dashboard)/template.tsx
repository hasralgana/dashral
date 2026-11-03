/**
 * Re-mounts on every navigation (unlike the layout), so each page arrives the same way: it fades in from a soft blur
 * and rises a few pixels. With reduced motion it only fades.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-in fade-in-0 blur-in-[6px] slide-in-from-bottom-1.5 duration-(--duration-considered) ease-enter motion-reduce:blur-in-0 motion-reduce:slide-in-from-bottom-0">
      {children}
    </div>
  )
}
