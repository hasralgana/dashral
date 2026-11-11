# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Image Cropper: a picture to crop before it's saved, in one tag (`<ImageCropper src={url} aspect={1} shape="circle" />`): drag it or use the arrow keys to move it under the crop, zoom with the slider, the wheel, a pinch or + and −, and turn it 90° at a time; the crop never shows an empty corner. `onCropChange` gives the area in the picture's pixels, and `cropImage` draws it into a file at the width you ask for
- Avatar Upload: a profile photo or logo with its upload, in one tag (`<AvatarUpload label="Profile photo" onValueChange={upload} />`): pick a picture or drop it on the preview, crop it in a dialog, and get a square file back (512 px JPEG by default, `outputType="image/png"` for a logo); a new picture fades in over the old one, and `name` sends the file with a plain form
- Profile settings block: a profile form (photo cropped as it's picked, name, username, bio, website, place) beside a card that shows how the profile looks to others as you type; `onSave` gets the photo as a File when it's new, null when it was removed

### Changed

- Dashboard Settings: the profile photo is an Avatar Upload, so a photo can be picked or dropped, cropped to a square and removed; it goes with the form's other fields as `photo`

## [1.3.1] - 2026-11-10

### Fixed

- Combo Chart: a negative value on the right axis (a negative margin against revenue) now reads against the same zero as the bars: both axes put their zero on one grid line, with `alignZero={false}` to let each axis fit its own values; the solid grid line sits at zero, where bars stand, when a chart goes below it

## [1.3.0] - 2026-11-10

### Added

- Tracker: a row of status squares for uptime, job runs or habits, in one tag; each square's color says how it went, and hovering one (or the arrow keys) reads its label and note under the row while the others fade back. Where it's narrow, the oldest squares make room and the start label follows
- Combo Chart: bars and lines on one chart, in one tag; each series is `type: "bar"` (the default) or `"line"`, and a line of another kind of value takes an axis of its own on the right (`axis: "right"`, written with `rightFormatOptions`), its ticks on the same grid lines. Line Chart takes `axis: "right"` and `rightFormatOptions` too
- Numbers count to their new values when the data changes, as MetricCard's do: Donut Chart's legend, Bar List's values and shares, Treemap's total and tile values, Gauge's value and Progress Circle's percentage (with `CountTo` in `lib/count-to`, for your own numbers too). The Pricing Tiers block's prices count when the billing changes (they used to fade in again), and the Revenue Chart block's total when the period does
- Funnel Chart has a Motion edition: when the data changes, every value, share and drop turns on odometer wheels while the bars and the flow glide to their new heights
- Funnel Chart: conversion step by step, in one tag (`<FunnelChart data={steps} />`): each step's value and its share of the first step (or, with `percent="previous"`, of the step before) written out, the flow narrowing between the bars and how many dropped written above each one; the bars and their values rise in; when the data changes the bars and the flow ease to their new heights and the numbers count to theirs
- Month Picker: a month (or, with `view="year"`, a year) picked in a field, in one tag (`<MonthPicker label="Report month" />`); for monthly and yearly reports, billing periods and card expiry, where a day picker asks for too much. Arrow keys move through the months, the year opens a grid of years, and `min`/`max` limit what can be picked

### Fixed

- Donut Chart: hovering a slice or a legend row counts the middle to its value, and moving between rows (or across the gaps between slices) no longer drops the hover for a moment
- Avatar Group with showNames: avatars with initials and the +N count sat 3px lower than the ones with a picture; they line up now

## [1.2.0] - 2026-11-10

### Added

- Action Bar has a Motion edition: it rises in on the appear spring and drops away quicker
- Swap: content that changes in place, in one tag (`<Swap value={copied}>{copied ? <Check /> : <Copy />}</Swap>`): the old content fades out while the new one arrives (fade, rise or pop), or after it (`wait`); for an icon turning into a check, a label after an action, a form giving way to a thank-you. With a Motion edition, in which what's around glides to the new size
- Glide: an element that glides to its new place and size when the layout changes (a row as a list is sorted, a card as the view turns to a grid), or to another place by a shared `layoutId` (a highlight moving between cards). Its Motion edition does the gliding; without motion it's simply the element
- RevealList, and `as` on Reveal: a list whose rows grow in when added, fold away when removed and glide to their new places in the Motion edition
- Reveal: content that appears and disappears in place, in one tag (`<Reveal open={failed}>…</Reveal>`), its height growing so what's below moves down smoothly instead of jumping; for an error under a field or in a dialog, a hint, a field that depends on another. With a Motion edition: the height glides, what's inside rises as it fades in, and closing never cuts a line
- Sortable: items you put in order by dragging, in one tag with the same parts as List: rows with a grip (or the whole row), numbered priorities, or a grid of tiles such as a product's photos. Mouse, touch (press and hold) and keyboard (Space, the arrow keys, Space), each step announced; `onReorder` gets the new order

### Changed

- Menus, popovers and tooltips open as calmly as the Motion editions: Dropdown Menu, Context Menu, Menubar, Select, Popover, Hover Card, Tooltip and Navigation Menu's panel rise 6px on the standard curve, without the overshoot and the blur
- Menubar: moving from one open menu to the next swaps the panels at once, as in a desktop app; only opening and closing the bar animate
- Data Table's Export menu lists the formats with icons and a chevron on its button, like the other export menus; its heading shows only when rows are selected
- Autocomplete's list lines up with the field's box: with a prefix (a search icon) it started after the icon, narrower than the field; a press on the prefix no longer closes it
- Scroll Shadow takes `fade="end"`: only the end fades while there's more, for a list whose headings stick to its top (the docs sidebar)
- `npx create-dashral --pro` (0.2.3) never stops at Git's username and password prompt: without access it says at once what to do (accept the GitHub invitation, then `gh auth login`, or `--from` with SSH), and a lost connection is told apart from a missing invitation. With `--no-install` it clones Pro and prints the install and `pnpm dashral init` to run, instead of stopping at the setup, which needs the dependencies. Pro stays the monorepo so `pnpm dashral update` can bring in new apps and their migrations
- `npx create-dashral` without a folder asks for the project's name (Enter takes `my-app`), as create-next-app does, instead of printing its help; a flag's value (`--template classic`) is never taken for the folder
- `npx shadcn add @dashral/<name>` works with nothing to set up: Dashral is in shadcn's registry directory. The README, `@dashral/ui`'s README and a flat project's README now lead with the name, and the repository README keeps the full URL beside it
- The README puts copying the source with the shadcn CLI first and installing from npm second
- Dashral Pro's repository moved to github.com/dashral-ui/dashral-pro (a GitHub organization, which Polar's repository benefit needs; GitHub forwards the old address); `npx create-dashral --pro` (0.2.2) clones it from there

### Fixed

- Editable Text no longer cuts its text 12px short
- Report Header works out today's dates in the browser, so a page rendered ahead of time (a static build) no longer shows its build day and fails to hydrate

## [1.1.1] - 2026-11-06

### Changed

- `pnpm dashral init` (and so `npx create-dashral`) leaves out demo.dashral.com's stand-in sign-in (`app/api/demo`, `lib/demo-sign-in.ts`, `proxy.ts`, a cookie and no accounts): the sign-in, sign-up and two-factor pages stay, and `lib/sign-in.ts` is the one place to connect them to your auth (README → Make it yours, Add sign-in in a flat project's README)

## [1.1.0] - 2026-11-06

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

### Fixed

- Tabs (and their Motion edition): a row of tabs wider than its space, on a phone, scrolls sideways and keeps the picked tab in sight, instead of running out of the page
- Data Table: on a phone, the page count and its buttons move under "Rows per page" when they don't fit beside it

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

[Unreleased]: https://github.com/hasralgana/dashral/compare/v1.3.1...HEAD
[1.3.1]: https://github.com/hasralgana/dashral/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/hasralgana/dashral/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/hasralgana/dashral/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/hasralgana/dashral/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/hasralgana/dashral/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/hasralgana/dashral/releases/tag/v1.0.0
