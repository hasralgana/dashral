# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Data Table: `autoResetPage={false}` keeps the page while rows are edited in place, such as a count typed into a cell; a new search or filter still starts from the first page
- The Classic dashboard: Finance, Projects, Support, Inventory and Monitoring pages, built on data tables you can filter, select, export and edit in place and on the kit's charts, plus an AI assistant, Getting started and a two-factor sign-in page, in all three languages
- `@dashral/ui` and `@dashral/motion` on npm: `npm install @dashral/ui`, import `@dashral/ui/globals.css` once, then `import { Button } from "@dashral/ui/components/button"`; the shadcn registry stays for copying the source
- `pnpm dashral init --layout flat` makes the app a Next.js project of its own: its files at the root, `@dashral/ui` from npm, no packages, turbo or workspace; `npx create-dashral` now does this by default, and `--monorepo` keeps the repository's layout for `pnpm dashral update`
- `npx create-dashral my-app` starts a new dashboard in one command: it clones the newest release, installs it and runs `pnpm dashral init` with the options you give it (`--pro` for Dashral Pro); the theme customizer's **Copy setup command** now gives this command for the look you picked
- `pnpm dashral init` and `pnpm dashral update` know Classic's new pages: Inset only and blank pages leave them out, and an update doesn't bring new Classic pages into an Inset-only app
- Aspect Ratio: a box that keeps its shape (16 / 9, 4 / 3, a square) as it resizes, for an image, a video or a map
- Banner: a strip across the page for news that concerns everyone, with a title, an action and a close button, full width or floating
- Button Group: buttons joined into one control, side by side or stacked, for a toolbar or a split button with a menu
- Code Block: code to read and copy, with a file name or tabs, line numbers, marked lines and wrapping
- Collapsible: one section that opens and closes under its title, with a count or badge beside it
- Color Picker: a hex field with a swatch that opens saturation, brightness and hue (keyboard too), presets and a pick from the screen
- Countdown: time left until a moment, in boxes or one line, with unit names in the reader's language
- Description List: terms and their values in one tag, beside each other, at either end or stacked in columns
- Lightbox: a grid of pictures that opens each one large, with arrows, swipes and captions
- Menubar: the row of menus along the top of an app (File, Edit, View), with the same items as Dropdown Menu
- Navigation Menu: a site's main navigation, with menus that open a panel of links with icons and descriptions
- Phone Input: a phone number with a searchable country list, grouped as it's typed and given in international form (E.164)
- Progress Circle: progress as a ring for small spaces, with the percentage or an icon in the middle
- Prose: good-looking text from the HTML that Markdown, MDX or a CMS produces, for a blog, docs or a changelog
- Rating: a star rating that works with the keyboard and in forms, with words for each value, and a read-only average with fractions
- Action Bar: the bar that rises from the bottom while rows are selected, with the count, actions for them and a way to clear the selection
- Autocomplete: a text field that suggests as you type, where any text is still a valid answer, with rich suggestions and your own search
- Checkbox Group: several checkboxes under one label, as a list or cards, with "Select all" and a limit
- Indicator: a dot or a count on the corner of a button, an avatar or a tab, scaling in and out
- List: rows with a picture, a title, details and actions, linking as a whole, that move their details under the text where it's narrow
- Page Header: the top of an admin page, with a breadcrumb or a back link, the title, a description, details, actions and tabs
- Relative Time: a moment as people say it ("3 minutes ago", "yesterday"), in the reader's language and kept current
- Date Picker: `withTime` adds a time field under the calendar; the value is the day at that time
- Editable Text: text you click to change in place, the same size as it was, with checks and saves that can fail and undo themselves
- Form Section: one group of a settings page, its title and description beside the fields, plain or in a card with a Save bar
- JSON Viewer: JSON to read and explore, objects and arrays folding with their size shown, colored values, pages for long arrays and copy
- Time Zone Select: every time zone with today's offset, its city and its name in the reader's language, searchable, or the reader's own
- Input: `strength` on a password shows a meter (weak to strong) and, with "rules", the rules it counts, ticked as they're met

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
