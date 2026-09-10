# Changelog

## 6.0.0

First release of the `bullmq-monitor` packages, forked from
[`@bull-monitor/*`](https://github.com/s-r-x/bull-monitor) 5.4.0, which was
archived in 2023.

The npm scope changed, so this is a fresh major rather than an upgrade of the
original packages.

### Features

- **Filter jobs by name.** A new `name` argument on the `jobs` query, exposed in
  the dashboard next to the data search. Plain text matches a case-insensitive
  substring, `*` switches to wildcard matching. Combines with the jsonata data
  search, and both are part of the shareable workspace link.
- **Clear filters.** One action resets the job id, name and data filters.
- **Filter presets.** The host app ships saved searches through
  `ui.filterPresets`. A preset sets the status, name and data search together;
  a `{{value}}` placeholder makes the dashboard prompt for an id first, so one
  preset covers lookups by organization, order or customer.
- **Per-scheme logo.** `ui.logo.darkPath` supplies a second image for dark
  mode, since a single-colour wordmark drawn for one scheme vanishes in the
  other.
- **Branding from the host app.** A new `ui` option sets the title, logo,
  favicon, extra top-bar links, date formats and colours without rebuilding the
  dashboard. Light and dark palettes are configured separately, down to
  surfaces, text and per-status colours. `ui.theme.lock` hides the appearance
  controls.
- **Auth.** An `auth` guard in the core config protects the page, its assets and
  the GraphQL endpoint on every adapter, with a `basicAuth` helper included.
- **`bullmq-monitor-nest`.** A real NestJS module with `forRoot` and
  `forRootAsync`, replacing the copy-paste example. Routes are declared without
  wildcards, so it behaves the same on Nest 10, 11 and 12, on Express or Fastify.
- **BullMQ v6 support**, alongside v5. Bull v4 keeps working.
- **The dashboard ships inside the package.** Assets are served by your app
  instead of being fetched from jsDelivr, so the dashboard works offline, behind
  a firewall and at any mount path.
- **Read-only queues in the CLI** via `--readonly`.

### Breaking changes

- Packages renamed from `@bull-monitor/*` to unscoped `bullmq-monitor*`, so the
  scope no longer has to belong to anyone.
- Node.js 20 or newer is required.
- Apollo Server 3 (end of life) replaced by Apollo Server 5. Adapters now speak
  a small framework-agnostic HTTP contract instead of embedding Apollo's own
  middleware.
- `BullMonitorFastify.init` takes `{ app }` instead of a raw server, and
  `BullMonitorHapi.init` takes `{ auth }`.
- The CLI defaults to BullMQ; pass `--bull` for Bull. Its binary is now
  `bullmq-monitor`.
- `bullmq-monitor` exposes `BullMQAdapter` and `BullAdapter` from the
  package root; the `dist/bull-adapter` deep import is gone.
- Queue ids are derived from the key prefix and queue name, so bookmarked links
  from `@bull-monitor` do not carry over.

### Fixes

- Data search on the `waiting` status scanned the wrong redis key and always
  returned nothing. Both Bull and BullMQ store those ids under `wait`.
- Jobs found by search could not resolve their own status, which made the whole
  query fail once the dashboard asked for it. Scanned jobs now carry the status
  of the list they came from, which also removes one redis round-trip per job.
- Assets were cache-busted with the package version, so a rebuild without a
  version bump served a stale bundle behind the one-year immutable cache. They
  are now fingerprinted by content.
- The "disable polling while searching" setting never changed, because its
  toggle called the store setter inside another setter.
- The pagination total ignored active filters and reported the unfiltered queue
  count. It now reports what is actually loaded.
- `BullMQAdapter` no longer pins consumers to the bullmq version this package
  was built against; its queue parameter is typed structurally.
- The published type declarations no longer reference `bull` or `redis-info`.
  Both are optional or dev-only, so a consumer type-checking with
  `skipLibCheck: false` failed on our own `.d.ts` files.
- Importing the package no longer requires `bull`. It is an optional peer
  dependency, but the entry point pulled it in eagerly, so any app that only
  uses BullMQ crashed on import.
- The top bar no longer floods the page with the brand colour; it uses the
  surface colour and follows the configured palette.
- In dark mode the delayed status keeps the project's blue but in a lighter
  tone, which the original 800 shade turned muddy against a dark surface.
- The selected queue in the drawer is tinted neutrally instead of with the
  brand colour, which went brown once a warm accent was configured.
- In dark mode MUI painted a translucent white gradient over raised surfaces, so
  dialogs, menus and cards came out lighter than the configured colour. The
  overlay is dropped once a surface colour is set, and the configured surface is
  what you actually see.
- Status chips put 5px before the count and 12px after the label, because MUI
  insets a chip avatar for a round image rather than a number. Both insets are
  now equal.
- A logo that fails to load falls back to the title as text instead of leaving a
  broken image in the top bar.
- The selected status filter takes the colour of its own status rather than the
  brand colour, so the row keeps reading as a legend instead of turning every
  selection into one colour.

### Dependencies

- Dashboard: React 18, Vite 5, jotai 2, zustand 4, MUI 5.
- Adapters: Express 4 and 5, Koa 2 and 3, Fastify 4 and 5, Hapi 20 and 21,
  NestJS 10, 11 and 12.

---

Earlier history of the upstream project is kept in
[s-r-x/bull-monitor](https://github.com/s-r-x/bull-monitor/blob/main/CHANGELOG.md).
