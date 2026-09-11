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
| `@kinra/web/registry`                | source registry manifest                                  |

Every entry point imports `tokens.css` and can be used alone. `base.css`
declares the cascade layer order `kinra.reset, kinra.base, kinra.type,
kinra.compositions, kinra.components, kinra.prose`; a consumer that skips
`base.css` receives layers in import order instead.

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

Small UI text uses 12px and 14px roles at the default root size. Interactive
edges use `--kin-color-control-edge`, separate from the quieter structural
rules. Buttons, fields, chips, switches, and segmented controls share
`--kin-control-radius`; `--kin-surface-hover` provides neutral hover feedback.
Selected states retain their signal colour. Compact controls retain their
documented heights, and touch text inputs use at least 16px to avoid focus zoom.

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
| `.kin-label`    | an uppercase group label                      |
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

| Class           | Responsibility                                   | Options                                                       |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `.kin-region`   | responsive vertical region space                 | `--kin-region-space`, `data-space`, `data-rule`               |
| `.kin-stack`    | vertical rhythm                                  | `data-space`, `data-split="last"`                             |
| `.kin-cluster`  | wrapping peer row                                | `data-space`, `data-align`, `data-justify`, `data-wrap`       |
| `.kin-grid`     | auto-fitting fluid grid                          | `data-space`, `--kin-grid-min`, `data-columns`, `data-rules`  |
| `.kin-split`    | two peer regions                                 | `data-space`, `data-ratio`, `data-align`                      |
| `.kin-sidebar`  | bounded rail plus flexible region                | `data-space`, `data-side`, `--kin-sidebar-size`               |
| `.kin-center`   | a centred bounded measure                        | `data-measure`, `data-text`, `--kin-center-measure`           |
| `.kin-cover`    | a minimum-height region with one principal child | `[data-principal]`, `--kin-cover-min`                         |
| `.kin-switcher` | a row that becomes a column when it cannot fit   | `--kin-switch-at`                                             |
| `.kin-reel`     | a horizontal scrolling, snapping row             | `--kin-reel-item`                                             |
| `.kin-bar`      | start, centre, and end slots                     | `data-slot`, `data-rule`, `data-collapse`, `--kin-bar-height` |

`data-space` accepts `tight`, `compact`, `loose`, or `none`; omitting it uses
the composition's ordinary default. `data-ratio` accepts `lead`, `trail`, or
`golden`. `data-columns` accepts `2`, `3`, or `4` and collapses on narrow
screens. `data-rules` separates grid cells with the hairline instead of open
space; `data-rules="deep"` gives cells the deep ground. Split, sidebar, and
fixed column counts collapse to one column at `48rem` while preserving DOM
order.

## Components

Components expect semantic HTML. Class names do not replace labels, headings,
table scope, descriptions, roles, or native control behavior.

### Controls and labels (`components.css`)

- `.kin-badge` labels taxonomy or bounded state; `data-tone`,
  `data-variant="solid"`, `data-numeric`.
- `.kin-chip` is an interactive tag for filters, selections, or removal;
  `aria-pressed` renders selection and `.kin-chip__remove` holds the button.
- `.kin-notice`, `__title`, `__body`, and `__actions`; `data-tone`,
  `data-density="compact"`.
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
- `.kin-empty`, `__title`, and `__body`; `data-align="center"`.
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
  footer `data-justify="between"`.
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

## Surface recipes

Apply `data-kin-surface` to a document or bounded subtree. A recipe changes
role values only; it does not create a page shell.

| Value           | Bias                                                    |
| --------------- | ------------------------------------------------------- |
| `editorial`     | generous rhythm, long-form measure, serif display voice |
| `documentation` | wider shell, denser navigation, readable prose          |
| `learning`      | mono prose, focused measure, sequential reading         |
| `operations`    | compact controls and data-dense working measure         |
| `application`   | broad canvas, tighter regions, product-owned workspace  |

`data-kin-voice="serif|mono|sans"` changes only the display and heading voice
for a bounded region. `data-kin-scheme` changes only the ground. All three
axes compose.

A consumer may override any recipe role it can own safely. Product-specific
navigation, editors, grids, and immersive canvases remain local.

## Registry patterns

The exported manifest and pattern source live in [`../registry`](../registry).
Candidates include narrative intro, editorial feature, and operations region.
Read [`registry/README.md`](../registry/README.md) before copying one. Registry
classes use `kin-pattern-` only in canonical source; a consumer should rename
them when product-specific behavior or composition enters.

## Compatibility

Adding a class, token, recipe, or registry item is additive. Renaming or
removing a stable class, token, data value, asset, or export is breaking under
the repository's pre-1.0 release rules. Candidate registry source may change
before promotion, and its status makes that instability explicit.

Colour roles now resolve through `light-dark()`, and every entry point relies
on `color-mix()` and cascade layers. Consumers target browsers released from
mid-2024 onward.
