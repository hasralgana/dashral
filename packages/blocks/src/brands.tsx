// The made-up brands every block names, in one place: one per role a product might connect to, each with a name, a
// colour and a mark of its own. They read like real software (a payments company, a team chat) without looking like
// any real company's, so a block can ship as it is and claims no integration a product doesn't have.
//
// Blocks don't import this: each keeps a copy of the brands it uses in a `brands` constant at its top, so a block is
// still one file to copy. `pnpm brands:sync` rewrites those copies from here (`--check` only reports what's out of
// step). Change a brand here, then run it.

export type Brand = {
  /** The brand's name, as the blocks write it. */
  name: string
  /** What it is, for the catalog. */
  category: string
  /** One line on what it does. */
  description: string
  /** Its tile colour (the mark is drawn in white on it; dark brands turn light in dark mode). */
  color: string
  /** Its mark, on a 24px grid, in currentColor. */
  mark: React.ReactNode
}

export const brands = {
  payments: {
    name: "Fernpay",
    category: "Payments",
    description: "Cards, subscriptions and payouts",
    color: "bg-[#6d5ef7]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 4h11l-1.6 3.6H8V4Z" />
        <path d="M8 10.2h7.6L14 13.8H8v-3.6Z" opacity={0.75} />
        <path d="M5 4h3.6v16H6.2A1.2 1.2 0 0 1 5 18.8V4Z" />
      </svg>
    ),
  },
  chat: {
    name: "Murmur",
    category: "Team chat",
    description: "Channels, threads and alerts for a team",
    color: "bg-[#0f9d8a]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.2 2.6c-.33.27-.8.03-.8-.39V13a1 1 0 0 1-1-1V6.5Z" opacity={0.6} />
        <path d="M10 11.5A2.5 2.5 0 0 1 12.5 9h5a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5H17v2.1c0 .42-.47.66-.8.39L13 17h-.5a2.5 2.5 0 0 1-2.5-2.5v-3Z" />
      </svg>
    ),
  },
  crm: {
    name: "Dealbird",
    category: "CRM",
    description: "Contacts, deals and pipelines",
    color: "bg-[#f97316]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 16 12 8l8 8-2.6 2.6L12 13.2l-5.4 5.4L4 16Z" />
        <path d="M8 8.6 12 4.6l4 4-2 2-2-2-2 2-2-2Z" opacity={0.65} />
      </svg>
    ),
  },
  code: {
    name: "Forkly",
    category: "Code hosting",
    description: "Repositories, pull requests and releases",
    color: "bg-[#24292f] dark:bg-white dark:text-[#24292f]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="7" cy="6" r="2.4" />
        <circle cx="17" cy="6" r="2.4" />
        <circle cx="12" cy="18" r="2.4" />
        <path d="M7 8.4v1.1a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V8.4M12 12.5v3.1" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
      </svg>
    ),
  },
  store: {
    name: "Cartwell",
    category: "Online store",
    description: "Products, orders and checkout",
    color: "bg-[#16a34a]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.5 8.5h13l-1 11a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4l-1-11Z" />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </svg>
    ),
  },
  support: {
    name: "Tickety",
    category: "Customer support",
    description: "Tickets, chat and satisfaction scores",
    color: "bg-[#e11d48]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" />
      </svg>
    ),
  },
  issues: {
    name: "Trackline",
    category: "Issue tracking",
    description: "Issues, sprints and roadmaps",
    color: "bg-[#4f46e5]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="5" width="16" height="3.2" rx="1.6" />
        <rect x="4" y="10.4" width="11" height="3.2" rx="1.6" opacity={0.8} />
        <rect x="4" y="15.8" width="6" height="3.2" rx="1.6" opacity={0.6} />
      </svg>
    ),
  },
  docs: {
    name: "Pagewell",
    category: "Docs and notes",
    description: "Pages, wikis and meeting notes",
    color: "bg-[#191919] dark:bg-white dark:text-[#191919]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 3.5h7l4.5 4.5v11A1.5 1.5 0 0 1 17 20.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" opacity={0.85} />
        <path d="M14 3.5V8h4.5" opacity={0.5} />
      </svg>
    ),
  },
  files: {
    name: "Driftbox",
    category: "File storage",
    description: "Files and folders, shared",
    color: "bg-[#0ea5e9]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3 20 8l-8 5-8-5 8-5Z" />
        <path d="M4 12.5l8 5 8-5V16l-8 5-8-5v-3.5Z" opacity={0.7} />
      </svg>
    ),
  },
  analytics: {
    name: "Peekly",
    category: "Web analytics",
    description: "Visits, sources and conversions",
    color: "bg-[#f59e0b]",
    mark: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="13" width="4" height="7" rx="1" />
        <rect x="10" y="9" width="4" height="11" rx="1" opacity={0.85} />
        <rect x="16" y="4" width="4" height="16" rx="1" opacity={0.7} />
      </svg>
    ),
  },
} satisfies Record<string, Brand>

export type BrandRole = keyof typeof brands
