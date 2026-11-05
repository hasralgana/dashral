# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Data Table: `autoResetPage={false}` keeps the page while rows are edited in place, such as a count typed into a cell; a new search or filter still starts from the first page
- The Classic dashboard: Finance, Projects, Support, Inventory and Monitoring pages, built on data tables you can filter, select, export and edit in place and on the kit's charts, plus an AI assistant, Getting started and a two-factor sign-in page, in all three languages
- `pnpm dashral init` and `pnpm dashral update` know Classic's new pages: Inset only and blank pages leave them out, and an update doesn't bring new Classic pages into an Inset-only app

## [1.0.0] - 2026-11-04

The first release of Dashral: React components, their motion editions and a Next.js admin dashboard, free and open source.

### Added

- `@dashral/ui`: 78 accessible components on Radix UI and Tailwind CSS v4, in twelve groups: Actions, Inputs, Selects, Dates, Overlays, Navigation, Layout, Data display, Feedback, Charts, Effects and AI. Each takes its props in one tag, with labels, hints and errors wired up for screen readers
- Charts in plain SVG: area, line, bar, donut, sparkline, candlestick, heatmap, treemap, gauge and bar list, with tooltips, keyboard focus and a table version for screen readers
- `@dashral/motion`: motion editions of 26 components on motion/react, with the same props. Springs from shared tokens, one highlight that glides between items, numbers that turn on odometer wheels, controls you drag and hold, limits you can feel, and reduced motion honoured everywhere. Its libs (`tokens`, `odometer`, `text-morph` and more) are exported for your own code
- Themes: `themes.css` sets the primary color, light and dark backgrounds, card style, font and radius as data attributes, on the whole app or on one element, with six presets
- Languages: `LocaleProvider` with English, Indonesian and Arabic, each language's plurals, number and date formats, and right-to-left layouts
- shadcn registry: every component, motion edition and lib can be added with `npx shadcn@latest add`, along with what it builds on
- The dashboard (`apps/demo`): Classic and Inset templates on Next.js 16 with an overview, files, settings, pricing, sign-in and sign-up, error pages, ⌘K search, notifications, a live theme customizer and three languages
- `pnpm dashral init` sets up your own app from a fresh clone (template, pages, languages, name and look), and `pnpm dashral update` brings in later releases

[Unreleased]: https://github.com/hasralgana/dashral/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hasralgana/dashral/releases/tag/v1.0.0
