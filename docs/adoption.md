# Consumer adoption

`@kinra/web` is a versioned, build-time dependency. It gives Kinra web
products a shared visual and interaction vocabulary without making routes,
content, workflows, or deployments depend on one repository.

## The contract

This package owns:

- role-named tokens and the Graphite+ palette;
- accessibility and reduced-motion foundations;
- canonical Kinra marks;
- scoped canvas, frame, prose, composition, component, and surface-recipe
  classes;
- the application shell's frame: its geometry, layers and states, and the
  behaviour contract that moves between them;
- candidate source patterns with evidence and accessibility guidance; and
- future compatibility adapters after real reuse earns them.

The consumer owns:

- routes and information architecture;
- curriculum, documentation, product copy, and claims;
- product-specific layout, workflow, state, and interaction, including the
  shell's state, its behaviour and whatever fills it;
- copied registry code after adaptation; and
- analytics, deployment configuration, and release artifacts.

The dependency exists only during installation and build. Generated products
contain their own CSS and assets and do not contact GitHub or this repository
at runtime.

## Install an exact release

The package requires Node.js 22.12 or newer. Add the public HTTPS Git
dependency to the consumer's `package.json`:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.6.0"
  }
}
```

Run `npm install` and commit the resulting lockfile. Use an immutable release
tag, or a full commit SHA while testing unreleased source. Never ship a
dependency on `main`, a floating version range, a local path, or a live CSS
CDN.

## Choose the integration depth

| Entry point                          | Provides                                                    | Best fit                                             |
| ------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------- |
| `@kinra/web/styles`                  | complete opinionated system                                 | a Kinra-owned surface starting from this foundation  |
| `@kinra/web/styles/tokens.css`       | custom properties and the scheme switch                     | a host theme that owns reset and structure           |
| `@kinra/web/styles/base.css`         | tokens, reset, layer order, and global defaults             | a custom shell without shared canvas or prose        |
| `@kinra/web/styles/canvas.css`       | quiet canvas, frame, surfaces, rules, buttons, and status   | a simple branded shell or compatibility import       |
| `@kinra/web/styles/type.css`         | display, title, headline, lede, and label roles             | consistent typographic hierarchy without prose       |
| `@kinra/web/styles/compositions.css` | stack, cluster, grid, split, sidebar, cover, bar, and more  | product-owned layouts using shared relationships     |
| `@kinra/web/styles/components.css`   | fields, chips, switches, notices, tables, and empty states  | operating and application controls                   |
| `@kinra/web/styles/navigation.css`   | tabs, breadcrumbs, pagination, rails, toolbars, and steps   | wayfinding inside a product shell                    |
| `@kinra/web/styles/feedback.css`     | progress, meters, spinners, skeletons, toasts, and hints    | asynchronous and working surfaces                    |
| `@kinra/web/styles/overlays.css`     | dialogs, drawers, popovers, and menus                       | native top-layer interaction                         |
| `@kinra/web/styles/data.css`         | figures, key-value lists, logs, code, avatars, cards, lists | evidence and collections                             |
| `@kinra/web/styles/recipes.css`      | surface, scheme, and voice role adjustments                 | tuning density and voice without adopting a template |
| `@kinra/web/styles/prose.css`        | scoped `.kin-prose` typography                              | lessons, guides, and documentation                   |
| `@kinra/web/styles/shell.css`        | rail, column, inset panel, bar, and drawer                  | an application whose pages stand beside its work     |
| `@kinra/web/assets/*`                | canonical brand assets                                      | headers, favicons, and metadata                      |
| `@kinra/web/registry`                | pattern manifest and copyable source                        | product-owned higher-level composition               |

For a new Astro surface, import the complete system once in its root layout:

```astro
---
import "@kinra/web/styles";
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---

<body class="kin-canvas" data-kin-surface="editorial">
  <header><img src={wordmarkUrl} alt="Kinra" /></header>
  <main class="kin-frame"><slot /></main>
</body>
```

Choose a ground with `data-kin-scheme="light|dark|auto"` on `html` or on a
bounded subtree; the default is graphite. Choose a voice for a region with
`data-kin-voice="serif|mono|sans"` when the surface recipe's choice is not
right for that region. Read [`composing.md`](composing.md) before assembling
a page.

Site CSS should load after the package and override role tokens rather than
copying values. Keep product rules scoped: an unlayered `main { width: 100% }`
beats `.kin-frame` and removes its gutter on narrow screens; a later global
paragraph rule can similarly defeat component rhythm. Do not repair a local
override by changing the shared frame. Bind `--kin-surface-nested` to the
actual page tone when composing a work surface. The complete class and data-value contract lives in
[`catalog.md`](catalog.md).

## Copy a registry pattern

Registry source is a starting point rather than an imported runtime. Read the
item guidance, copy its HTML and CSS, preserve semantics, and adapt it under
the consumer's ownership. Rename `kin-pattern-` classes to the consumer's
prefix once product-specific decisions enter. See
[`../registry/README.md`](../registry/README.md).

## Moving from 0.1 to 0.2

The `0.2.0` release consolidated patterns proven independently by Kinra Site
and Depot:

- `.kin-canvas` replaced the grid and ambient glows with one quiet top wash;
- `.kin-frame` took ownership of the repeated 82rem measure and responsive
  page gutter;
- `.kin-surface` became square, flat, and rule-bound by default, while
  `.kin-surface--raised` opted into radius and shadow;
- `.kin-prose` adopted flatter editorial treatment for quotations, code,
  tables, and rules; and
- buttons stopped lifting decoratively on hover.

When upgrading, remove local canvas and frame copies only after visual review.
Add `.kin-surface--raised` wherever the old elevation carries real meaning.

## Moving from 0.2 to 0.3

The 0.3 expansion adds classes and roles and changes several defaults. Removing
product wordmarks is an incompatible asset change; the replacement is below.
Expect these visual differences when upgrading past `v0.2.0`:

- Every colour role resolves through `light-dark()`; the default remains
  graphite, and `data-kin-scheme` selects paper or the reader's preference.
- `.kin-badge` is square-cornered instead of a pill, and `.kin-status` uses a
  square marker instead of a dot.
- `.kin-eyebrow` is sentence case and led by a square mark;
  `data-case="upper"` restores the uppercase treatment.
- Display, title, and section type come down to reading scale: display is
  now 36 to 48px instead of 44 to 72px, title 28 to 36px, section 22 to
  28px. Tracking opens to `-0.03em` and `-0.025em`, and the headline
  measures widen to match. A consumer that wants the old poster scale can
  set `--kin-text-display` and `--kin-text-title` back locally.
- `data-kin-surface="editorial"` gives display type the serif voice.
  Set `--kin-font-display: var(--kin-font-mono)` on the surface to keep the
  previous mono display.
- `.kin-prose h1` uses the display voice, and `.kin-prose hr` is a short
  mark rather than a full-width line.
- `.kin-button` without a modifier has a stronger neutral border and a hover
  state.
- `base.css` declares the cascade layer order explicitly.
- The paper ground has a warmer neutral cast, with deeper signal and muted
  text for contrast inside selected rows and tinted labels.
- Small text roles increase from 11/13px to 12/14px. Controls share a 6px
  default corner through `--kin-control-radius`; override that role when a
  consumer needs a different control shape. `--kin-color-control-edge` remains
  available for consumer-drawn boundaries, independently of structural rules;
  the shared fields now use the wells described below.
- `data-kin-voice="sans"` changes display and heading roles only, matching
  the other voice choices. Use `--kin-font-ui` explicitly for sans UI text.
- Prose line height follows `--kin-leading-prose`, including the learning
  recipe's wider leading.
- The product wordmarks and the Facet mark are gone from `assets/`. A
  consumer that imported one, such as `spaces-wordmark.svg`, replaces it with
  `.kin-lockup` around `mark.svg` and the product name as text, following
  [`brand.md`](brand.md).

### Space's soft-layer refresh

Version 0.3 also carries the shared treatment brought back
from Kinra Space. The class names and exports stay available, but an upgrade
changes appearance:

- Ordinary surfaces, cards, panel disclosures, and bounded lists are soft
  layers without a ruled frame. Radii step down from panel to layer to row;
  nested cards return to the panel's tone. Paper cards retain a faint ring.
- Fields and segmented tracks are translucent wells. Quiet buttons and chips
  rise in the text's own tone; badges, avatars, and switches stay square.
  Invalid fields and keyboard focus retain their edges.
- Lists, facts, toolbars, dialog chrome, and log entries separate with tone
  and space. Tables keep row rules; sticky headers keep an opaque ground.
  Explicit ledger rules and comparison grids remain available.
- Labels use sentence case with normal tracking. Notices and toasts retain
  a still signal edge around both leading corners. Menus, dialogs, and sheets
  use the shared layer radii and shadows.
- Primary buttons inside a card, notice, surface, or disclosure use the tint,
  leaving the screen's fill available. Modal dialogs and drawers keep their
  own primary fill. The consumer chooses the primary action and its position.

The second port from Space `0550b0e45c601981ebbd768d7d0d2344a9925de3`
adds compact/touch control parity, paragraph rhythm, compact empty states,
rounded notice/toast edges, right-to-left disclosures and dialog spacing/focus.
It changes shared defaults without promoting any registry candidate. See the
catalog's `/refresh/` page for the specimens.

During adoption, remove local shared-class copies and aliases only after
visual comparison on both grounds, desktop and touch, forced colours and
reduced motion. Bind `--kin-surface-nested` on the product page to its local
page tone. Keep product animation ownership, clipped-region focus, safe areas,
resizable layout and intentional exceptions local. A product that animates
native dialogs itself must disable Design's default dialog/backdrop arrival to
avoid two movements. No consumer dependency changes in this repository.

The [corner action](../registry/patterns/corner-action/README.md),
[corner key](../registry/patterns/corner-key/README.md), and
[live edge](../registry/patterns/live-edge/README.md) are candidate copy-owned
patterns. Their modules and markup are optional source, never an automatic
runtime dependency. The reference catalog's `/refresh/` page shows the
states on both grounds, including declarative faces without script.

Consumers target browsers released from mid-2024 onward because of
`light-dark()`, `color-mix()`, `:has()`, and native `popover`.

## Moving through 0.4 and 0.5

Design 0.4.0 adds Kinra Mono, grid hairlines between cells, tint-only selected
rows, start-aligned table text and consistent keyboard hints. Design 0.5.0
adds Kinra Sans and Kinra Serif; 0.5.1 adds terminal characters to Mono, not a
new styling refresh. The [changelog](../CHANGELOG.md) owns the complete lists.

- Kinra Sans and Kinra Serif lead `--kin-font-sans` and `--kin-font-serif`
  (Kinra Type 0.1.0), so prose and the serif and sans voices change face
  where the fonts load. Their metrics differ from Inter and the system
  serif, so check wrapping on dense screens. A consumer that wants the old
  face sets `--kin-font-sans` or `--kin-font-serif` back locally. Bundlers
  that resolve `url()` in CSS emit the woff2 files; a consumer that
  vendors the CSS alone also copies `assets/fonts/` with its `OFL.txt`.
- Kinra Mono draws box drawing, block elements and braille (Kinra Type
  0.2.0, from Design 0.5.1). They fill the cell from the line's descent to
  its ascent, so rows join at a 1.3 line height and overlap below it; set
  terminal-like text at 1.3 or less where its lines should be continuous.
  Kinra Sans and Kinra Serif leave these characters out.

## Moving to 0.6: application typography

Blake approved sans as the application default on 2026-10-11 following a review
of Space and Home. This is not part of 0.5.1. Version 0.6.0 changes
`data-kin-surface="application"` to sans UI, heading and display roles. Sizes,
weights, prose and code roles stay unchanged; other recipes keep their defaults.
Ordinary text takes the UI font on the recipe element, including a bounded
subtree, rather than inheriting a computed mono font from the outer page.
`data-kin-voice` still changes only headings/display, not UI.

To retain mono application chrome, load this after Design and place the class
on the same element as the recipe (`html`, `body` or a bounded region):

```css
.mono-application[data-kin-surface="application"] {
  --kin-font-ui: var(--kin-font-mono);
  --kin-font-heading: var(--kin-font-mono);
  --kin-font-display: var(--kin-font-mono);
}
```

```html
<body data-kin-surface="application" class="mono-application">
  <!-- Mono UI and headings; prose remains sans and code remains mono. -->
</body>
```

Bind all three roles at the recipe boundary: an alias inherited from the root
has already resolved there. A regional `data-kin-voice="serif"` or `"mono"`
can still change headings inside the application without changing its controls.
The complete stylesheet loads recipes after entries that import root defaults;
selective imports should likewise put `recipes.css` last, before consumer CSS.

The `/applications/` catalog page demonstrates top navigation and pane-based
work using existing components, common page/section heads and a collection
with inspection and sample async states. Its layout classes stay reference-only.
Version 0.6 implies no product shell, navigation runtime or registry
promotion; the shared [application shell](#moving-to-07-the-application-shell)
comes with 0.7.

### Consumer verification for this change

Text metrics change even though sizes do not. Before adopting an exact release
or candidate commit, compare both schemes, desktop and phone widths, long
labels and text zoom, keyboard focus, forced colours, reduced motion and touch
controls. Check UI, headings, mono identifiers and overlays inside the recipe.
Compare the unchanged non-application regions too.

- **Space:** run its source and Chromium/WebKit browser gates and compare heads,
  forms, menus, dialogs and panes. Keep its fallback faces, measures, resizable
  shell, safe areas, native-host handling and attention behavior local. Remove
  only overrides shown redundant; native/device acceptance is separate.
- **Home:** run `task verify:app` in its owner and compare Live, Events, history
  controls and inspectors using synthetic data in Chromium and WebKit. Preserve
  its top navigation and media workflows. Check local frame overrides before
  attributing a gutter difference to Design; no camera access is needed.

Neither consumer is upgraded or qualified by Design's own checks. Home's
phone/Safari lived fit and Space's installed/native acceptance remain their
owners' gates, not claims made by the reference examples.

## Moving to 0.7: the application shell

Prepared for 0.7.0, not yet released. The shell is additive: no existing
class, token, recipe default or registry status changes, and a consumer that
does not use `.kin-shell` sees no difference. Kinra Space, Kinra Home and
Kinra Relay each built the same shell; each can now replace its copy, in its
own repository and on its own schedule. The
[catalog](catalog.md#application-shell-shellcss) is the contract, and `/shell/`
shows every state.

### Adopt the shell

1. Pin the release, or a full commit while testing unreleased source.
2. Load `shell.css`. The complete stylesheet includes it; a selective import
   adds `@import "@kinra/web/styles/shell.css";` after the entry points whose
   classes it restyles (`canvas.css`, `components.css`, `navigation.css`) and
   before `recipes.css`. With `base.css` first, its `kinra.shell` layer follows
   `kinra.components` whatever the order.
3. Put the shared classes on the product's markup (mapped below), keeping the
   product's own classes beside them while its local rules still apply.
4. Derive the state attributes from the product's own state: `data-folded`,
   `data-drawer` from its own breakpoint, `data-scroll`, `data-labels`,
   `data-resizing`, `data-scrolled` on the bar, and `inert`.
5. Check the behaviour against the
   [catalog's list](catalog.md#behaviour-each-product-writes).
6. Bind the measures and tones that differ, then remove local shell rules only
   after comparing both schemes, desktop open and folded, the drawer on a phone,
   right to left, forced colours, reduced motion and touch.

All three copies differ from the shared shell in the same few places:

- The K sits on the bar's centre line. The rail's head is now the bar's own
  height, inset by `--kin-shell-inset`; before, the K stood 2px above the
  bar's controls. The pages stay where they were; the column starts 4px higher
  and the rail's foot ends 4px lower.
- A closed drawer is hidden as well as inert, as Relay's already was. Under
  reduced motion it is not displayed, so an opening drawer can take focus at
  once despite the base stylesheet's reduced-motion transitions.
- A tip wraps beyond 18rem rather than running on.

### Kinra Space

From `751343ee`. Space is the model: its geometry and behaviour come through
except where noted.

| Space                                                                                                                        | Shared                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.app-shell`, `.sidebar-collapsed`, `.nav-open`                                                                              | `.kin-shell`, `data-folded`, `data-drawer="closed\|open"`                                                     |
| `.navigation-backdrop`                                                                                                       | `.kin-shell__backdrop`                                                                                        |
| `aside.sidebar`                                                                                                              | `.kin-shell__sidebar`                                                                                         |
| `.sidebar-head`, `.brand`                                                                                                    | `.kin-shell__head`, `.kin-shell__home`                                                                        |
| `.sidebar-pages`, `.sidebar-sessions`, `.sidebar-bottom`                                                                     | `.kin-shell__pages`, `.kin-shell__marks`, `.kin-shell__foot`                                                  |
| `.sidebar-band`                                                                                                              | `.kin-shell__column`                                                                                          |
| a rail `.kin-nav__item`, `.sidebar-tip`                                                                                      | `.kin-shell__item`, `.kin-shell__tip`                                                                         |
| `.rail-favorite-mark`, a rail item's `.kin-nav__trail`                                                                       | `.kin-shell__glyph` holding a `.kin-status`                                                                   |
| `.main-shell`, `.topbar`, `.main-content`                                                                                    | `.kin-shell__panel`, `.kin-shell__bar`, `.kin-shell__page`                                                    |
| `.sidebar-toggle`, `.mobile-menu`                                                                                            | `.kin-shell__fold`, `.kin-shell__menu`                                                                        |
| `--space-sidebar-width-collapsed`, `--space-sidebar-width`, `--space-drawer-width`, `--space-topbar-height`, `--space-shelf` | `--kin-shell-rail`, `--kin-shell-column`, `--kin-shell-drawer-column`, `--kin-shell-bar`, `--kin-shell-inset` |
| `--space-selected`, `--space-viewport-height`, `--space-safe-*`                                                              | bind `--kin-shell-current`, `--kin-shell-height`, `--kin-shell-safe-*`                                        |
| `data-resizing` on the root                                                                                                  | `data-resizing` on the shell as well                                                                          |

Space keeps its splitter, which writes `--kin-shell-column` in place of
`--space-sidebar-width`, and its drawer under a finger, which sets
`data-resizing` on the shell while its own rule moves the drawer and keeps a
closed one visible as it is drawn open. It keeps the
palette control and its live edge, the measuring of its favorites, the
letters' door and the account menu; its crumb trail with the faded cut, which
need not use `.kin-shell__crumbs`; the workspace tools, search, the session's
fold and Kin's door; Live and Favorites; the server-side `sidebar` preference;
native-host and visual-viewport handling; and its 48rem breakpoint.

What changes for Space: opening the drawer moves focus into it and makes the
page inert; Escape and the backdrop give focus back to the menu; and ⌘B or
Ctrl+B opens and closes the drawer below 48rem instead of yielding there
(Blake's choice, 2026-10-12).

### Kinra Home

From `202b009`, the most compact copy.

| Home                                                                | Shared                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `.kh-shell` with `data-railed`, `data-drawer`                       | `.kin-shell` with `data-folded`, `data-drawer="closed\|open"`                                           |
| `.kh-backdrop`, `aside.kh-sidebar`                                  | `.kin-shell__backdrop`, `.kin-shell__sidebar`                                                           |
| `.kh-sidebar__head`, `.kh-brand`                                    | `.kin-shell__head`, `.kin-shell__home`                                                                  |
| `.kh-sidebar__pages`, `.kh-sidebar__marks`, `.kh-sidebar__bottom`   | `.kin-shell__pages`, `.kin-shell__marks`, `.kin-shell__foot`                                            |
| `.kh-mark-link`, `.kh-mark`, `.kh-tip`                              | `.kin-shell__item`, `.kin-shell__glyph`, `.kin-shell__tip`                                              |
| `.kh-sidebar__band`                                                 | `.kin-shell__column`                                                                                    |
| `.kh-panel`, `.kh-topbar`, `.kh-main` and its `kh-page` container   | `.kin-shell__panel`, `.kin-shell__bar`, `.kin-shell__page` and its `kin-shell-page`                     |
| `.kh-topbar__fold`, `.kh-topbar__menu`, `.kh-crumbs`                | `.kin-shell__fold`, `.kin-shell__menu`, `.kin-shell__crumbs`                                            |
| `--kh-rail`, `--kh-band`, `--kh-bar`, `--kh-shelf`, `--kh-selected` | `--kin-shell-rail`, `--kin-shell-column`, `--kin-shell-bar`, `--kin-shell-inset`, `--kin-shell-current` |
| `--kh-safe-*`                                                       | `--kin-shell-safe-*`                                                                                    |

Home keeps its camera rows and their recordings action, the footage disk and
detector at the column's foot, the camera marks' initials and lights, its
three-state scheme control, the recorder's health at the bar's end, its page
padding, the fold in localStorage, and its 48rem breakpoint.

What changes for Home: the drawer's current item takes the panel's tone where
Home used the page's ground (bind `--kin-shell-current` in the drawer to keep
it); Escape leaves an open popover or modal to close first; following a link
gives focus to the page; crossing the breakpoint moves focus out of the
drawer without travel; and forced colours draw the shell's edges.

### Kinra Relay

From `21b464b`, its shell from `bf05738`.

| Relay                                                          | Shared                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `.app-shell` with `data-railed`, `data-drawer`                 | `.kin-shell` with `data-folded`, `data-drawer="closed\|open"`, `data-scroll="document"`, `data-labels="drawer"` |
| `.shell-backdrop`, `aside.sidebar`                             | `.kin-shell__backdrop`, `.kin-shell__sidebar`                                                                   |
| `.rail-head`, `.brand`                                         | `.kin-shell__head`, `.kin-shell__home`                                                                          |
| `.rail-pages`, `.rail-marks`, `.rail-bottom`                   | `.kin-shell__pages`, `.kin-shell__marks`, `.kin-shell__foot`                                                    |
| `.rail-item`, `.mark-link`, `.rail-tip`, `.rail-label`         | `.kin-shell__item`, `.kin-shell__tip`, `.kin-shell__label`                                                      |
| `.build-mark` with its `.kin-status`                           | the mark and its `.kin-status` inside a `.kin-shell__glyph`                                                     |
| `.nav-badge`, `.menu-badge`                                    | `.kin-shell__badge` in the item's or the menu's glyph                                                           |
| `.sidebar-band`                                                | `.kin-shell__column`                                                                                            |
| `.panel`, `.topbar`, `.page`                                   | `.kin-shell__panel`, `.kin-shell__bar`, `.kin-shell__page`                                                      |
| `.topbar-fold`, `.topbar-menu`, `.crumbs`, `.topbar-end`       | `.kin-shell__fold`, `.kin-shell__menu`, `.kin-shell__crumbs`, `.kin-shell__end`                                 |
| `--relay-rail`, `--relay-band`, `--relay-bar`, `--relay-inset` | `--kin-shell-rail`, `--kin-shell-column`, `--kin-shell-bar`, `--kin-shell-inset`                                |
| `--relay-shelf`, `--relay-panel`                               | bind `--kin-shell-shelf`, `--kin-shell-panel` and `--kin-shell-flush`                                           |

Relay keeps its palette, bound to the tone properties; the workspace head and
the Build list in the column; the account card and its placement; the
appearance control; freshness and Refresh at the bar's end; the cap of eight
pinned Builds; the narrower column from 60 to 75rem; page padding and
measure; the parts table's sticky offset, measured against the document while
the page scrolls with it; and the 60rem breakpoint that `wide()` shares, from
which it sets `data-drawer`.

What changes for Relay: the shell mirrors right to left, where Relay's drawer,
badges and padding were physical. Rail items are Space's 2.25rem rows rather
than 2.5rem squares. The current rail item takes the panel's tone rather than
a raised card with a primary icon, and the panel has no ring or drop; bind
`--kin-shell-current` and keep a local rule to keep either. Counts are square
and muted unless `data-tone` says otherwise: `primary` for unseen changes and
`reason` for what waits on the reader keep today's colours. The account card
should open toward the page in either direction.

### Consumer verification for the shell

Design's checks cover the shell in its own demo, not in any product. Each
owner runs its own gates on an exact Design commit: Space its source and
Chromium/WebKit browser gates, Home `task verify:app` and its browser matrix,
Relay its browser workflows, each comparing the states listed above. Installed,
device and native-host acceptance remain their owners' gates.

## Testing exact source

The type, composition, component, navigation, feedback, overlay, data, recipe,
and registry layers ship in `v0.3.0`. Prefer the immutable release tag; test
later unreleased source only through a full immutable commit SHA. Consumer
upgrades remain separate maintainer decisions.

## Update a consumer

1. Read the design release and rendered reference catalog.
2. Change the exact tag or test commit in the consumer's dependency record.
3. Run the consumer's native install or vendoring process.
4. Build and visually verify desktop and mobile widths, keyboard focus,
   reduced motion, and the consumer's own high-value workflows.
5. Commit and deploy from the consumer repository on its own schedule.

There is no automatic fleet-wide rollout. Releases may coexist across
consumers for as long as each product needs.

## Current adoption map

- **Kinra Site** and **Gateway** pin the exact expanded-system test commit
  `21327ae489243316988019e6b6ca9a7737982699` through public GitHub codeload
  URLs and package-lock integrity.
- **Kinra Space** pins released Design **0.6.0**, exact commit
  `7f05565b5183121edf141f320a184bc3d2338bb4`, since its `4a510857`
  (2026-10-11), including `wordmark-space.svg`.
- **Kinra Home** pins **0.6.0** through `#v0.6.0`, resolved by its lockfile to
  `7f05565b5183121edf141f320a184bc3d2338bb4`, since its `7493fc4` (2026-10-11).
- **Kinra Relay** pins **0.6.0** through the public codeload archive of
  `7f05565b5183121edf141f320a184bc3d2338bb4`, with package-lock integrity, since
  its `b259fc6` (2026-10-12).
  These three pins were read from each owner's manifest and lockfile on
  2026-10-12, at Space `751343ee`, Home `202b009` and Relay `21b464b`. Each
  consumer's package/lockfile owns its current revision and its own gates own
  upgrade evidence.
- **Kin** and **Scope** copy exact assets from `21327ae`, with provenance in
  each owning vendored manifest; neither gains a runtime dependency.

Site and Gateway retain their earlier exact test pins. Space, Home and Relay
are on released 0.6.0 and each carries its own copy of the application shell
until it adopts 0.7.
Retired Spaces and Kinra OS, and retiring Depot, retain earlier pins as
recovery evidence.
A consumer's own upgrade, verification and deployment remain independent.
