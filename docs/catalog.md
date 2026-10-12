# Public design catalog

The package separates durable responsibilities from copy-owned composition.
Every public custom property and class uses the `kin-` namespace. All CSS
entry points are framework-independent and safe to bundle at build time.

The rendered reference catalog demonstrates the current contract:

```bash
npm run dev
```

## Entry points

| Entry point                          | Provides                                                  |
| ------------------------------------ | --------------------------------------------------------- |
| `@kinra/web/styles`                  | complete opinionated system                               |
| `@kinra/web/styles/tokens.css`       | custom properties and the scheme switch                   |
| `@kinra/web/styles/base.css`         | tokens, reset, layer order, and global defaults           |
| `@kinra/web/styles/canvas.css`       | quiet canvas, frame, surfaces, rules, buttons, and status |
| `@kinra/web/styles/type.css`         | typographic roles as classes                              |
| `@kinra/web/styles/compositions.css` | opt-in layout relationships                               |
| `@kinra/web/styles/components.css`   | controls, labels, notices, fields, tables, and states     |
| `@kinra/web/styles/navigation.css`   | tabs, breadcrumbs, pagination, rails, toolbars, and steps |
| `@kinra/web/styles/feedback.css`     | progress, meters, spinners, skeletons, toasts, and hints  |
| `@kinra/web/styles/overlays.css`     | dialogs, drawers, popovers, and menus                     |
| `@kinra/web/styles/data.css`         | figures, key-value lists, logs, code, avatars, cards      |
| `@kinra/web/styles/recipes.css`      | opt-in surface, scheme, and voice role adjustments        |
| `@kinra/web/styles/prose.css`        | scoped long-form typography                               |
| `@kinra/web/styles/shell.css`        | the application shell: rail, column, panel, bar, drawer   |
| `@kinra/web/registry`                | source registry manifest                                  |

Every entry point imports `tokens.css` and can be used alone. `base.css`
declares the cascade layer order `kinra.reset, kinra.base, kinra.type,
kinra.compositions, kinra.components, kinra.shell, kinra.prose`; a consumer
that skips `base.css` receives layers in import order instead.

## Foundations

Tokens cover semantic colour on two grounds, brand, signal tints and edges,
three typographic voices, a twelve-step spacing scale, causal motion, shape
and depth, named layers, controls, reading measures, shell measures, and
responsive region spacing. Consumers override roles rather than copying
values:

```css
.product-reader {
  --kin-font-prose: var(--kin-font-mono);
  --kin-measure-prose: 42rem;
}
```

Small UI text uses 12px and 14px roles at the default root size. Controls use
`--kin-control-radius` (6px); switches, badges, and avatars keep square corners.
Fields and segmented tracks use `--kin-surface-well` and `--kin-surface-well-hover`.
Quiet controls use `--kin-surface-lift` and `--kin-surface-lift-hover`; neutral
hover remains available as `--kin-surface-hover`. Lines remain for focus,
invalid fields, selected tabs, table rows, and explicit comparison grids.
`--kin-color-control-edge` remains available to consumers that need an edge.
Code views colour by role: `--kin-color-code-string` for strings,
`--kin-color-code-keyword` for the language's own words, and
`--kin-color-code-name` for the names a file defines and calls. Comments and
punctuation take `--kin-color-text-muted`, and everything else the text's own
tones; each role holds 4.5:1 on `--kin-color-ground-deep` and
`--kin-color-surface` in both schemes.
Compact buttons, list-row trailing actions, toast actions and toolbar controls
share 36px geometry, 12px type and 4px by 12px padding. Under a coarse pointer
they and menu rows keep the 44px `--kin-hit-target`; the application and
operations recipes raise their default controls to the same target. Touch text
inputs use at least 16px to avoid focus zoom. A consumer may keep product
chrome compact where its own interaction contract calls for it.

### Layers and motion

`--kin-radius-panel`, `--kin-radius-layer`, and `--kin-radius-row` step down
through a page (12px), its cards (8px), and their rows (6px).
`--kin-radius-sheet` is 16px for the free corners of a sheet.
`--kin-radius-mark` keeps marks at 2px; `--kin-edge-width` is the shared 2px
signal edge. `--kin-tint-primary-hover` deepens a tinted confirmation under
the pointer. `--kin-backdrop` resolves on the root so an overlay's local depth
does not lighten the backdrop.
Cards and ordinary surfaces use `--kin-surface-card`; paper keeps a faint
`--kin-surface-card-ring` so a white card remains distinguishable from the
panel. Nested cards return to `--kin-surface-nested`, which consumers can
set to their page's tone. `--kin-surface-step` provides a quiet tonal step.
What floats has an edge: `--kin-float-ring` is its hairline, dark on paper
and light on graphite. Its shadows are short, a contact line and a small fall,
black on graphite so they never lighten the ground: `--kin-shadow-panel` for
a layer whose own border draws the edge (toasts and popovers),
`--kin-shadow-overlay` for one with no border (the ring and the panel's fall),
`--kin-shadow-float` for a modal layer over its backdrop, whose edge the
dialog paints inside and a drawer only on the side facing the page, and
`--kin-shadow-raised` for a composer over scrolling content, whose frame draws
its edge. Tooltips, chips in the text's own colour, take neither. Ordinary
cards have no elevation shadow.

`--kin-motion-control`, `--kin-motion-surface`, and `--kin-motion-layer`
pair the existing durations and easing. The corner key uses
`--kin-duration-bloom|retract|lift|morph|fold|trace|close` and
`--kin-ease-bloom|lift|morph`: respectively 260, 200, 260, 320, 400, 1600,
and 300ms. Its optional module reads those tokens. Reduced motion renders
the same face in place and holds the working outline still.

### Scheme

Every colour role resolves through `light-dark()`. The default scheme is
graphite. Set `data-kin-scheme` on the document or any bounded subtree:

| Value   | Ground                            |
| ------- | --------------------------------- |
| `dark`  | graphite, the default             |
| `light` | paper                             |
| `auto`  | follow the reader's OS preference |

A subtree that changes scheme re-establishes its own ground and ink, so a
paper panel can sit inside a graphite page. Signal colours deepen on paper to
hold 4.5:1 contrast; no role is renamed.

### Voice

`--kin-font-ui`, `--kin-font-heading`, `--kin-font-display`, `--kin-font-prose`,
and `--kin-font-code` are roles. `--kin-font-mono`, `--kin-font-sans`, and
`--kin-font-serif` are the voices they draw from. The editorial recipe gives
display type the serif voice; `data-kin-voice` changes it for any region.

### The mark

Kinra's only ornament is a small square derived from the wordmark's block
letterforms. It appears in the eyebrow, the status marker, the corner mark on
a toned surface or card, the ledger tick on a rule, the spinner, and the log
marker. The square says "state lives here"; colour names the state. The K,
the wordmark, and the product lockup are specified in [`brand.md`](brand.md).

### Foundational classes

- `.kin-canvas` and `.kin-frame`; `.kin-frame` accepts
  `data-measure="content|prose|narrow"`.
- `.kin-surface`, `.kin-surface--raised`, `.kin-surface--sunken`, and
  `.kin-surface--plain`; `data-tone="primary|reason|success|warning|error"`
  adds the corner mark.
- `.kin-eyebrow` with an optional `data-tone="reason|muted"` and
  `data-case="upper"`.
- `.kin-rule` on an `hr`, with `data-tone="primary|reason|brand"`,
  `data-tick="none"`, `.kin-rule--labeled` (wrap a `span`), and
  `.kin-rule--vertical`.
- `.kin-button` with `--primary`, `--quiet`, `--ghost`, `--danger`, and
  `--icon` modifiers; `data-size="compact|large"`; `data-width="full"`;
  `aria-pressed` and `aria-expanded` render the pressed state.
- `.kin-button-group` joins sibling buttons.
- `.kin-status` with `data-state="reason|running|success|warning|error"`.
- `.kin-lockup` around `mark.svg` and a `span` holding the product name: the
  K, a hairline, and the name as text; `--kin-lockup-size` scales it.
- `.kin-prose` and `.kin-sr-only`.

## Type roles

Type roles set voice, size, weight, tracking, and measure. They start with
zero margin so the surrounding composition owns rhythm.

| Class           | Role                                          |
| --------------- | --------------------------------------------- |
| `.kin-display`  | the page statement, in the display voice      |
| `.kin-title`    | a page or article title, in the display voice |
| `.kin-headline` | a section statement, in the heading voice     |
| `.kin-subhead`  | a subsection heading                          |
| `.kin-heading`  | a component or group heading                  |
| `.kin-quiet`    | the muted second voice inside a statement     |
| `.kin-lede`     | the opening paragraph                         |
| `.kin-body`     | prose paragraph; `data-size="sm"`             |
| `.kin-caption`  | a quiet explanation                           |
| `.kin-label`    | a muted sentence-case group label             |
| `.kin-mono`     | mono voice on any element                     |
| `.kin-tabular`  | tabular figures                               |
| `.kin-truncate` | single-line truncation                        |

`.kin-display`, `.kin-title`, and `.kin-headline` carry a measure from
`--kin-measure-display`, `--kin-measure-title`, and `--kin-measure-headline`;
`data-measure="none"` removes it. `data-kin-align="center"` on a container
centres its statement.

## Compositions

Compositions establish spatial relationships and collapse without changing
source order.

| Class           | Responsibility                                   | Options                                                                                           |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `.kin-region`   | responsive vertical region space                 | `--kin-region-space`, `data-space`, `data-rule`                                                   |
| `.kin-stack`    | vertical rhythm                                  | `data-space`, `data-split="last"`                                                                 |
| `.kin-cluster`  | wrapping peer row                                | `data-space`, `data-align`, `data-justify`, `data-wrap`                                           |
| `.kin-grid`     | auto-fitting fluid grid                          | `data-space`, `--kin-grid-min`, `data-columns`, `data-rules`, `data-flush`, `--kin-grid-cell-pad` |
| `.kin-split`    | two peer regions                                 | `data-space`, `data-ratio`, `data-align`                                                          |
| `.kin-sidebar`  | bounded rail plus flexible region                | `data-space`, `data-side`, `--kin-sidebar-size`                                                   |
| `.kin-center`   | a centred bounded measure                        | `data-measure`, `data-text`, `--kin-center-measure`                                               |
| `.kin-cover`    | a minimum-height region with one principal child | `[data-principal]`, `--kin-cover-min`                                                             |
| `.kin-switcher` | a row that becomes a column when it cannot fit   | `--kin-switch-at`                                                                                 |
| `.kin-reel`     | a horizontal scrolling, snapping row             | `--kin-reel-item`                                                                                 |
| `.kin-bar`      | start, centre, and end slots                     | `data-slot`, `data-rule`, `data-collapse`, `--kin-bar-height`                                     |

`data-space` accepts `tight`, `compact`, `loose`, or `none`; omitting it uses
the composition's ordinary default. `data-ratio` accepts `lead`, `trail`, or
`golden`. `data-columns` accepts `2`, `3`, or `4` and collapses on narrow
screens. `data-rules` separates grid cells with the hairline instead of open
space; `data-rules="deep"` gives cells the deep ground; `data-rules="between"`
draws the hairline only between cells, never round them, at any count of
columns, padding each cell by `--kin-grid-cell-pad` across (1rem by default),
and `data-flush` sets its outer cells' content on the text's own edge. Split, sidebar, and
fixed column counts collapse to one column at `48rem` while preserving DOM
order.

## Components

Paragraphs in a notice, toast, field, empty state or shared stack, cluster and
grid have zero margins; the composition's gap owns their rhythm. Sentence-case
labels, statuses, spinners, tabs and breadcrumbs use normal tracking.

Components expect semantic HTML. Class names do not replace labels, headings,
table scope, descriptions, roles, or native control behavior.

### Controls and labels (`components.css`)

- `.kin-badge` labels taxonomy or bounded state; `data-tone`,
  `data-variant="solid"`, `data-numeric`.
- `.kin-chip` is an interactive tag for filters, selections, or removal;
  `aria-pressed` renders selection and `.kin-chip__remove` holds the button.
- `.kin-notice`, `__title`, `__body`, and `__actions`; `data-tone`,
  `data-density="compact"`. The still signal edge follows both leading
  corners; `--kin-notice-radius` defaults to the layer radius and steps down
  inside a card or surface. Direct buttons keep their own width.
- `.kin-field`, `__label`, `__hint`, `__error`, `__required`, and
  `__optional`; `data-layout="inline"`.
- `.kin-fieldset` and `__legend`; `data-variant="bounded"`.
- `.kin-input`, `.kin-select`, and `.kin-textarea` provide focus, invalid,
  disabled, and touch-target treatment; `data-size="compact"`.
- `.kin-input-group` joins `__affix` spans, controls, and buttons into one
  control.
- `.kin-check` wraps a native checkbox or radio and its label, with an
  optional `__hint`.
- `.kin-switch` wraps a native checkbox carrying `role="switch"`.
- `.kin-range` styles a native range input.
- `.kin-segmented` holds labels with radios, or buttons with `aria-pressed`,
  as one choice among peers; `data-width="full"`.
- `.kin-table-wrap` contains horizontal overflow and accepts `data-sticky`;
  `.kin-table` keeps native semantics and accepts `data-density="compact"`,
  `data-min="none"`, cell `data-align="numeric|center"`, cell
  `data-emphasis`, and row `aria-selected`.
- `.kin-empty`, `__title`, and `__body`; `data-align="center"`. With a direct
  title it is a full empty shape; without one it is a compact muted sentence,
  taking only a list row's padding when placed in a list.
- `.kin-disclosure` styles native `details` and `summary`, with content in
  `__body`; `data-variant="panel"`.

### Navigation (`navigation.css`)

- `.kin-tabs` with `__tab` and `__panel`; tabs may be buttons in a `tablist`
  with `aria-selected`, or links with `aria-current`.
  `data-variant="boxed|rail"`.
- `.kin-breadcrumb` styles a labeled `nav` holding an `ol`; the current page
  carries `aria-current="page"`. Override `--kin-breadcrumb-separator`.
- `.kin-pagination` styles a labeled `nav` holding a `ul`; `__gap` and
  `__summary`.
- `.kin-nav` styles a vertical list of links or buttons; `__group`, `__trail`,
  nested lists, `aria-current`, and `data-density="compact"`.
- `.kin-toolbar` with `__group`, `__title`; groups accept `data-grow` and
  `data-end`; `data-variant="bare|bottom"`, `data-wrap="none"`.
- `.kin-steps` with `__step`, `__index`, `__title`, and `__body`; the index is
  document text, `aria-current="step"` marks position, `data-state`
  accepts `done|current|error`, and `data-orientation="horizontal"`.

### Feedback (`feedback.css`)

- `.kin-progress` styles a native `progress`; with no value it sweeps.
  `data-tone`, `data-size="thin"`. `.kin-progress-group` with `__label` and
  `__value` shows the figure.
- `.kin-meter` styles a native `meter`; `data-tone="neutral"`.
- `.kin-spinner` renders three stepping marks beside its words; give it
  `role="status"`. `data-size="large"`, `data-tone="reason|muted"`.
- `.kin-skeleton` with `data-shape="text|heading|square|block"` and
  `--kin-skeleton-width`; mark the group `aria-busy`.
- `.kin-toast-region` is a fixed region with `data-placement`; `.kin-toast`
  holds `__title`, `__body`, and `__actions`, takes `data-tone`, and animates
  out when `data-leaving` is set.
- `.kin-kbd` styles a `kbd`.
- `.kin-tooltip` with `__hint` styles a `role="tooltip"` element the consumer
  positions.

### Overlays (`overlays.css`)

- `.kin-dialog` on a native `dialog` with `__header`, `__title`, `__close`,
  `__body`, and `__footer`; `data-size="narrow|wide"`,
  footer `data-justify="between"`. Header and footer stay fixed around the
  scrolling body; body children use one 1rem rhythm, including `kin-stack`.
  Header icons are compact, footer actions use the default control height,
  and body/footer focus rings sit inside their edges. Consumers own focus
  placement, dismissal and any replacement for the default arrival motion.
- `.kin-drawer` on a native `dialog` anchored to an edge; `data-side="start|bottom"`,
  `--kin-drawer-width`. It reuses the dialog parts.
- `.kin-popover` on any `[popover]` element; `__title`, `__body`,
  `data-padding="none"`, `--kin-popover-width`.
- `.kin-menu` with `__item`, `__shortcut`, `__separator`, and `__label`; items
  take `data-tone="error"`, `aria-checked`, and `aria-disabled`.

### Data (`data.css`)

- `.kin-figure` with `__label`, `__value`, `__delta`, and `__note`;
  `data-size`, `data-tone`, delta `data-trend="up|down|flat"` and
  `data-good="down"`.
- `.kin-kv` on a `dl` of `div` groups; `data-layout="stacked|grid"`,
  `data-density="compact"`, `data-rule="none"`, `--kin-kv-key`, and
  `dd[data-align="numeric"]`.
- `.kin-log` on an `ol` with `__entry`, `__time`, `__marker`, `__body`,
  `__title`, `__detail`, and `__actor`; entry `data-tone`, `data-live`, and
  list `data-time="none"`.
- `.kin-code` on a `figure` with `__header`, `__title`, `__actions`, and
  optional `__line` spans carrying `data-highlight`; `data-wrap`.
- `.kin-avatar` with `data-size="sm|lg"` and `data-tone`; `.kin-avatar-group`.
- `.kin-card` with `__header`, `__title`, `__meta`, `__body`, `__text`,
  `__footer`, and `__media`; `data-tone`, `data-variant="raised|plain"`,
  `data-link`, `data-density="compact"`.
- `.kin-list` on a `ul` with `__item`, `__lead`, `__body`, `__title`, `__meta`,
  and `__trail`; `data-variant="bounded|bare"`, `data-density="compact"`,
  `data-wrap`, item `data-link` and `aria-selected`.

Consumers remain responsible for validation logic, table column priorities,
tab selection and keyboard movement, menu focus management, popover
positioning, toast lifetimes, asynchronous state, and product-specific
behavior.

The `/examples/` reference page composes these primitives into a filterable
collection with inspectors, a preferences form with a live reading preview,
and a review checklist with a confirmation dialog. Its option cards and
compositions are reference-only experiments, not exported components or
registry candidates. They have no consumer evidence yet.

## Application shell (`shell.css`)

Kinra Space, Kinra Home and Kinra Relay each built the same frame, so it is
shared. The window is the shelf, a sidebar stands on it, and the page is one
raised panel inset from the shelf, with a bar above the page that scrolls
beneath it. The sidebar is a rail of the product's pages beside a column of
its work. Folded, the rail stays as it is and the column goes. Below a
breakpoint the product chooses, the sidebar is a drawer from the inline start
over a flush page. The stylesheet draws every state; the product sets the
state, writes the behaviour below and fills the shell. `/shell/` shows each
state on both grounds and right to left, running the reference behaviour.

<!-- prettier-ignore -->
```html
<div class="kin-shell" data-folded>
  <div class="kin-shell__backdrop" aria-hidden="true"></div>
  <aside class="kin-shell__sidebar" id="navigation" aria-label="Navigation">
    <div class="kin-shell__head"><a class="kin-shell__home" href="/">…</a></div>
    <nav class="kin-shell__pages" aria-label="Pages"><ul>…</ul></nav>
    <nav class="kin-shell__marks" aria-label="Pinned"><ul>…</ul></nav>
    <div class="kin-shell__column">…</div>
    <div class="kin-shell__foot">…</div>
  </aside>
  <div class="kin-shell__panel">
    <header class="kin-shell__bar">
      <button class="kin-button kin-button--ghost kin-button--icon kin-shell__fold">…</button>
      <button class="kin-button kin-button--ghost kin-button--icon kin-shell__menu">…</button>
      <nav class="kin-breadcrumb kin-shell__crumbs" aria-label="Where you are">…</nav>
      <div class="kin-shell__end">…</div>
    </header>
    <main class="kin-shell__page" id="main" tabindex="-1">…</main>
  </div>
</div>
```

- `.kin-shell` is the window, on the shelf, `--kin-shell-height` tall.
- `.kin-shell__sidebar` holds the rail's rows down its own track and the column
  beside them. Nothing in it clips, so tips reach over the column and the page.
- `.kin-shell__head` is the bar's own height and level with it. It holds
  `.kin-shell__home`, the K: the way home, without a fill under the pointer.
- `.kin-shell__pages` holds the primary pages. `.kin-shell__marks` holds the
  places the folded rail keeps; it shows only while folded and never scrolls,
  so the product shows as many as fit. `.kin-shell__foot` ends the rail, with
  controls such as the scheme and the account.
- `.kin-shell__item` is a rail control, a square in the track.
  `aria-current="page"` or `"true"` gives it the panel's tone, as it does a
  current `.kin-nav` row in the column.
- `.kin-shell__glyph` holds an item's icon, avatar or mark. A
  `.kin-shell__badge` count, muted unless `data-tone` names
  `primary|reason|success|warning|error`, or a `.kin-status` mark sits on its
  top end corner. A count repeats what the item's name says: hide it with
  `aria-hidden="true"` and say it in the name.
- `.kin-shell__label` is an item's visible name, shown beneath its glyph only
  in a labelled drawer.
- `.kin-shell__tip`, with `.kin-tooltip`, names an item beside it under a
  pointer that hovers and under the keyboard, above the column and the page.
  It steps aside while its control is `aria-expanded="true"`.
- `.kin-shell__column` is the product's work; its own lists scroll.
- `.kin-shell__panel` is the raised page and binds `--kin-surface-nested` to
  its tone. `.kin-shell__bar` is the bar over the page. `.kin-shell__fold`
  folds the sidebar beside the page and draws no pressed fill while open;
  `.kin-shell__menu` opens the drawer. `.kin-shell__crumbs`, on a
  `.kin-breadcrumb`, keeps one line, and a bar under 36rem keeps only the
  current page. `.kin-shell__end` ends the bar. `.kin-shell__page` scrolls
  inside the panel.
- `.kin-shell__backdrop` dims the page behind an open drawer.

The product sets the state:

| Attribute                       | Effect                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| `data-folded`                   | the rail alone beside the page; the drawer ignores it              |
| `data-drawer="closed\|open"`    | the drawer layout, from the product's own breakpoint               |
| `data-scroll="document"`        | as a drawer, the page scrolls with the document under a sticky bar |
| `data-labels="drawer"`          | as a drawer, items carrying a label show it, on a wider rail       |
| `data-resizing`                 | no transitions while the shell settles after a change of shape     |
| `data-scrolled` on the bar      | the hairline: the page is scrolled beneath the bar                 |
| `inert` on the sidebar or panel | the closed drawer, or the page behind an open one                  |

Its measures and tones are custom properties, set on `:root` or the shell:

| Property                                   | Default                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `--kin-shell-rail`                         | `3.5rem`                                            |
| `--kin-shell-rail-labelled`                | `4.5rem`, a labelled drawer's rail                  |
| `--kin-shell-column`                       | `17rem`; a product that resizes the column sets it  |
| `--kin-shell-bar`                          | `3.5rem`                                            |
| `--kin-shell-inset`                        | `--kin-space-2`, the panel's inset from the shelf   |
| `--kin-shell-height`                       | `100dvh`                                            |
| `--kin-shell-drawer-column`                | `17rem`                                             |
| `--kin-shell-drawer-max`                   | `85vw`                                              |
| `--kin-shell-shelf`                        | `--kin-color-ground-deep`                           |
| `--kin-shell-panel`                        | `--kin-color-surface`, the inset panel              |
| `--kin-shell-flush`                        | `--kin-color-ground`, the page in the drawer layout |
| `--kin-shell-current`                      | unset: the open item takes `--kin-shell-panel`      |
| `--kin-shell-safe-top\|bottom\|start\|end` | the safe-area insets, named by the flow             |

A column's first row `--kin-shell-bar` tall stands level with the K and the
bar. The bar is a container named `kin-shell-bar` and the page one named
`kin-shell-page`, so what each holds can answer its own width. The rules live
in the `kinra.shell` layer, after `kinra.components`, so the shell restyles
navigation, buttons and breadcrumbs inside itself while product CSS still
wins. `.kin-sidebar` remains the unrelated two-column composition.

With motion, the width and the drawer move at layer speed, the column fades
as the rail closes over it, a tip waits a moment before naming its item, and
a closed drawer hides once it has left. Under reduced motion every state is
the same and nothing travels; a closed drawer is not displayed. In forced
colours the inset panel, the open drawer, a scrolled bar and the current item
draw their edges, and the fold at rest draws none.

### Behaviour each product writes

The product moves the shell between its states, in its own framework, where
its state already lives. The catalog runs a framework-free reference of this
list, `examples/reference/src/scripts/shell.ts`, to read rather than import.

- **Layout.** Set `data-drawer` from your own breakpoint's `matchMedia`,
  `closed` or `open`; leave it off beside the page.
- **Fold.** The bar's fold control and the chord toggle `data-folded` beside
  the page. Name the control by what it will do (Collapse sidebar, Expand
  sidebar), set `aria-expanded` and `aria-controls`, and remember the fold
  wherever the product keeps preferences. The drawer ignores the fold and
  keeps it.
- **Chord.** ⌘B on a Mac and Ctrl+B elsewhere, never both, never with Alt or
  Shift, never a held key's repeats. It yields to an open modal and to rich
  text. As a drawer, it opens and closes the drawer.
- **Focus.** Folding while focus is in the column moves focus to the fold
  first. Opening the drawer focuses its current item, else its first.
- **Inert.** A closed drawer is `inert`; the panel is `inert` while the drawer
  is open.
- **Escape.** Closes the drawer unless a popover or modal is open, which
  closes first. Focus returns to the drawer's control, as it does when the
  backdrop closes the drawer.
- **Links.** Following a link in the drawer closes it, and the destination
  takes focus.
- **Breakpoint.** Crossing it closes the drawer, moves focus out of a sidebar
  that has just become inert, and sets `data-resizing` for the one reflow.
- **Hairline.** Set `data-scrolled` on the bar while the page's scroller is
  scrolled at all, and measure again after navigation.
- **Scroller.** Sticky offsets and off-screen checks measure the scroller the
  page actually moves in: the page in its panel, or the document.
- **Popovers.** A rail control's popover opens beside it, toward the page, in
  either direction. Author its `display` only under `:popover-open`.

Routes, the column's contents, which marks the rail keeps, the foot's
controls, the crumbs' words, the bar's end, gestures, native-host handling and
page padding stay with the product. [Adoption](adoption.md#moving-to-07-the-application-shell)
maps each consumer's classes to these.

## Surface recipes

Apply `data-kin-surface` to a document or bounded subtree. A recipe tunes
role values; the application recipe also applies its UI font to ordinary text
at its boundary. It does not create a page shell; that is the
[application shell](#application-shell-shellcss).

| Value           | Bias                                                      |
| --------------- | --------------------------------------------------------- |
| `editorial`     | generous rhythm, long-form measure, serif display voice   |
| `documentation` | wider shell, denser navigation, readable prose            |
| `learning`      | mono prose, focused measure, sequential reading           |
| `operations`    | compact controls and data-dense working measure           |
| `application`   | sans UI, headings and display; broad product-owned canvas |

`data-kin-voice="serif|mono|sans"` changes only the display and heading voice
for a bounded region. `data-kin-scheme` changes only the ground. All three
axes compose. Application typography changes in 0.6.0; see the
[migration and mono override](adoption.md#moving-to-06-application-typography).
The `/applications/` examples demonstrate page/section heads, top navigation
and pane-based work with reference-only layout. A product whose pages and work
stand in a sidebar uses the [application shell](#application-shell-shellcss).

A consumer may override any recipe role it can own safely. Product-specific
navigation, editors, grids, and immersive canvases remain local.

## Registry patterns

The exported manifest and pattern source live in [`../registry`](../registry).
Candidates include narrative intro, editorial feature, operations region,
corner action, corner key, and live edge. The last three bring back evidence
from Kinra Space and remain candidates until a second consumer proves the
same responsibility. `/refresh/` demonstrates their states and motion.
Read [`registry/README.md`](../registry/README.md) before copying one. Registry
classes use `kin-pattern-` only in canonical source; a consumer should rename
them when product-specific behavior or composition enters.

Patterns may include an optional, dependency-free JavaScript module when
motion cannot be expressed in CSS. Every state must render from HTML and CSS
alone, loading a module must not initialize a browser surface, and the module
must honor reduced motion without changing product state. These modules are
copied source, not a shared application runtime.

## Compatibility

Adding a class, token, recipe, or registry item is additive. Renaming or
removing a stable class, token, data value, asset, or export is breaking under
the repository's pre-1.0 release rules. Candidate registry source may change
before promotion, and its status makes that instability explicit.

Colour roles now resolve through `light-dark()`, and every entry point relies
on `color-mix()` and cascade layers. Consumers target browsers released from
mid-2024 onward.
