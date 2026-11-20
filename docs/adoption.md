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
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.8.0"
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

## Moving to 0.9: motion by what moves

Version 0.9.0 names motion by what moves, in [`motion.md`](motion.md).
Existing tokens keep their values, so a product that only uses
`--kin-motion-control`, `-surface` and `-layer` sees no change from them.

- **Terms and registers.** Every term is `--kin-duration-<term>` and
  `--kin-motion-<term>`. Content and place read `data-kin-motion`: productive
  by default, where settle, draw, stagger and navigate are 0ms and appear is
  180ms; set `expressive` on the document or a subtree for an instrument.
- **Deprecated.** `--kin-duration-retract`, `-lift`, `-fold` and
  `--kin-ease-lift` keep their values; move to exit and morph.
  `kinra-check-motion` names each use.
- **Layers leave.** Dialogs, drawers and popovers leave the way they came, at
  the exit term's 180ms, where the browser supports `overlay`; elsewhere they
  close at once. A product that animates its own exits removes them, so
  nothing leaves twice: Relay's `@supports (overlay: auto)` block in
  `src/app.css` and Space's `dismiss` and `sink`. An unlayered product
  transition overrides Design's exit. Move layout keyed on `[open]` or
  `:popover-open` to the base selector, so it holds while the layer leaves.
  Modality and focus move when the close starts.
- **The corner key.** A copy of the candidate engine no longer reads the
  retract, lift and fold tokens or `--kin-ease-lift`; its own timings are in
  one `SIGNATURE` object, and it needs Design's tokens loaded.
- **Visible changes.** A switch and a disclosure arrow answer at the control
  term (120ms, from 180ms). An indeterminate progress bar sweeps at 1.6s
  (from 1.4s), and a determinate fill follows its work at 180ms (from 320ms).
  Controls that changed tone on `ease` take the control term's standard
  curve.
- **The shell.** `Shell.settle()` is `navigated()`; `settle()` still works
  and is deprecated, since motion owns the word. The drawer closes at the
  exit term.
- **Script.** `@kinra/web/motion` reads a term from the element it moves.
  Replace a module that copies Design's numbers with it: in Svelte, a
  transition's `duration` is `motion(term, node).ms` and its `easing` is
  `motion(term, node).ease`, and `reduced()` replaces a product's own
  `prefersReducedMotion` or `still()`. Deprecated tokens map as
  `scripts/public-tokens.json` lists: retract and lift to
  `--kin-duration-exit`, fold to `--kin-duration-morph`, and
  `--kin-ease-lift` to `--kin-ease-in`.
- **Checks.** Add `npx kinra-check-motion --strict src` to the product's own
  check, and copy `tests/browser/motion-guard.spec.js` at the pinned tag,
  filling in its adapt block.
- **Entries.** The candidate [entries pattern](../registry/patterns/entries/README.md)
  carries first-sight entries for expressive subtrees.

Per product, each in its own session:

- **Kinra Observatory** sets `data-kin-motion="expressive"` on its root and
  maps `--motion-settle`, `-draw`, `-appear`, `-stagger` and `-journey`, with
  their `-ease` partners, to Design's terms, read through `@kinra/web/motion`;
  journey becomes navigate. Fix three things: `--motion-journey` is not
  zeroed with less motion, `lamp-blink` is unused, and its components'
  reduced-motion rules repeat what the register does. List its signatures
  with their `signature:` reasons: the hands' sweep and beat, the pulse
  strip's glide, the ribbon, the solar wind, the zoom's pace, the NTP
  exchange, the Sun's breath and light, and the time-lapse. Keep its
  off-screen, hands-only and pulse-strip tests.
- **Kinra Space** replaces `motion.ts`'s Svelte curves and duration mirror
  with Design's terms; renames `@keyframes settle` and `settle-still` to
  appear's, and its `settle()` gate; removes its own layer exits where
  Design's apply, and the global `animation: none !important` in
  `responsive.css`, which keeps `animationend` from firing; keeps its caption
  shimmer as its signature; follows the live edge's source; restates the
  Motion table in `docs/interface.md` in the standard's terms; and calls
  `navigated()`.
- **Kinra Relay** fixes `src/app.css:4059`, where
  `var(--kin-motion-control, 120ms) ease` is invalid and the row gets no
  transition; gives a row a change has touched the tone bar, held still with
  less motion, in place of its edge line; renames `settle` to exit, `lift` to
  appear and `bloom` to appear's open form; uses Design's curves; lets cards
  answer the pointer in tone; records Play as a signature; and removes its own
  layer exits where Design's apply.
- **Kinra Home, Kinra Thread, Kinra Site, Kin and Scope** take the release
  with nothing to change.

Compare dialogs, drawers, popovers and toasts closing, the switch and the
disclosure, on both grounds, in both engines, with and without less motion.

## Moving to 0.8: shared structure and the Svelte layer

Version 0.8.0 adds shared structure and adjusts list rows and card footers.

- `.kin-list__item` takes the row roles, 8px above and below and 12px at its
  ends (16px in a bounded list), where it took 12px and 8px; its minimum
  height is unchanged.
- A compact card's footer takes 16px all round, as its other parts do,
  through `--kin-surface-pad`.

What arrives:

- `page.css`: `.kin-page`, `.kin-page-head`, `.kin-section` and
  `.kin-section-head` ([page anatomy](catalog.md#page-anatomy-pagecss)).
- Row parts of `.kin-list`: `__main`, `__after`, item `data-tone`, list
  `data-rules` and `data-trail="reveal"`
  ([rows that act](composing.md#rows-that-act)).
- Spacing roles ([space by role](composing.md#space-by-role)) and the
  `kinra-check-spacing` command.
- `.kin-icon`, `.kin-loading` and `.kin-dialog__fields`.
- `@kinra/web/svelte`, the optional [Svelte layer](svelte.md).

Per product:

- **Kinra Space** moves its `.page-head`, `.section-heading` and
  `.section-head` CSS to the shared heads, or its `PageHead`, `SectionHead`,
  `Row`, `Card`, `Disclosure`, `Empty`, `Loading`, `Confirm`, `ContextMenu`,
  `Hint` and shell wiring to the layer's. Its context menus keep their shape,
  `show(event, items, anchor)`, though icons by name become snippets. It
  retires `scripts/check-layout-css.mjs` and its suppressions file for
  `npx kinra-check-spacing --strict src`. Read 2026-11-20 at `db1eeae3`, the
  strict check finds 21 lengths in about 16 declarations. Fifteen of Space's
  28 suppressions go away, since zero in a fallback passes; the rest, and a
  few its own script never reached (insets, radii, pages outside
  `src/styles`), need a value on the scale or an `off-scale:` reason. Its
  interface guide's page and section head rules point at the catalog's.
- **Kinra Relay** moves its inline `.page-head` and `.section-head` to the
  shared heads, and its dialog, toasts, `ActionMenu`, `tip` and shell wiring
  to the layer's; `{@attach tip(text, hint)}` keeps its shape. It retires
  `scripts/scale.py` for `npx kinra-check-spacing src`. The default mode
  keeps Relay's own rule, on-scale lengths; it also checks insets and scroll
  margins, which `scale.py` did not, and finds 20 values in 19 declarations
  there, read 2026-11-20 at `6d804088`. Its five `off-scale:` reasons carry
  over. Moving to `Shell` brings the first-paint guard Relay lacks, Escape
  that waits for a modal, and a chord that refuses both modifiers.
- **Kinra Thread** gains a drawer, a fold and a hairline by moving its frame
  to `Shell`; today its sidebar stands beside the page on a phone.
- **Kinra Home** moves its shell wiring, the closest copy of the reference,
  to `Shell`, keeping its router by passing its route as `path`.

### When a product finds a Design problem

Fix it in Design and pin the new commit; do not override it locally and log
it as Design's work. Relay's notice edge and Space's row parts both waited in
a product's journal while the next product copied the workaround. A product
pass that changes how something shared looks or behaves either lands in
Design first or records why it cannot, and updates the adoption map below in
the same pass.

## Moving to 0.8: edges by meaning

Version 0.8.0 uses a line along an edge for work in flight, a bar set in from
the start for a still block's tone, and a square to mark state. The release
changes notice and switch styling and promotes the live edge pattern.

- `.kin-notice` and `.kin-toast` draw their tone as a 3px bar with round
  ends, `--kin-space-1` in from their start and `--kin-space-2` from top and
  bottom, in place of the line round both leading corners. Tones,
  `--kin-notice-radius` and forced colours' Highlight are unchanged. The new
  `--kin-tone-bar-width` gives a product's own still accents the same width.
- A switch's track takes `--kin-control-radius` (6px), and its thumb nests
  at 2px. Badges and avatars keep their 2px corners.
- The [live edge](../registry/patterns/live-edge/README.md) is a stable
  registry pattern. Each product still owns its copy; nothing changes unless
  it follows the source.

A notice that reports work still running carries the live edge in place of
its bar, as Relay's loading notice does.

Per product:

- **Kinra Relay** drew the bar first. After upgrading, remove its
  `.kin-notice::before` override in `src/app.css` (from its `bb0abd52`); its
  other still accents may read `--kin-tone-bar-width` in place of `3px`.
- **Kinra Space** sees its notices, toasts and switches change. Its interface
  guide says a switch's track stays square; change that with the upgrade.
- **Kinra Home** and **Kinra Thread** receive the change with nothing to
  remove.

Compare notices, toasts and switches on both grounds, right to left, and in
forced colours before deploying.

## Moving to 0.7.1: font refinements

Design 0.7.1 adopts all five font files from Kinra Type `v0.2.1`, with the
same font names, asset paths, coverage and vertical metrics. Every style has
a clearer ampersand. Sans upright and italic have more even text spacing;
its sample words average 4.0% narrower, while word spaces and tabular figures
keep their widths. Check line breaks in dense controls, tables, conversation
text and narrow columns at the weights and sizes your product uses.

Bundlers that resolve the existing font URLs emit the new files during the
consumer's next build. A consumer that vendors fonts copies all five files
and `OFL.txt` and records the provenance in `assets/fonts/VENDORED.md`.
Updating a dependency does not deploy the consumer.

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

New in 0.7.0, released on 2026-10-12. The shell is additive: no existing
class, token, recipe default or registry status changes for it, and a consumer
that does not use `.kin-shell` sees no difference from it. Kinra Space, Kinra
Home and Kinra Relay each built the same shell; each can now replace its copy,
in its own repository and on its own schedule. The
[catalog](catalog.md#application-shell-shellcss) is the contract, and `/shell/`
shows every state.

### Fixes every consumer receives

- **Reduced motion removes transitions.** `base.css` used to shorten every
  transition to 0.01ms, which held each property's old value for a frame on
  every element, so focus sent into a panel just shown found it still hidden.
  Now a change lands in the frame that makes it. `transitionend` no longer
  fires under reduced motion: a product that waits for it there should act on
  the change itself. An animation a component keeps still ends with its
  event, so a toast's exit still removes it; the arrivals of dialogs, drawers,
  popovers and toasts are removed under reduced motion and send none.
- **A toolbar's fields stand level under a finger.** Under a coarse pointer a
  toolbar's inputs and selects take the 44px target its buttons have; a local
  rule that raised them can go.
- **Overlays keep to the line right to left.** A `.kin-drawer` stands at the
  line's end, or its start, and arrives from that edge; a dialog's close
  reaches into the header's end corner. Left to right nothing moves.

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
   `data-resizing`, `data-scrolled` on the bar, and `inert`. The page lays out
   before `data-drawer` arrives, at its first paint and wherever a resize reads
   layout before the breakpoint's change, so the stylesheet takes the query the
   product's `matchMedia` reads, exactly, or at the breakpoint itself the
   sidebar would leave with no drawer to bring it back:

   ```css
   @media (max-width: 48rem) {
     .kin-shell:not([data-drawer]) > .kin-shell__sidebar {
       inset-inline-start: 0;
       position: fixed;
       translate: calc(-100% * var(--kin-flow)) 0;
     }
   }
   ```

   Without it the sidebar stands beside the page as a column and leaves the
   page a sliver; in Space, WebKit kept the heights laid out there after the
   drawer took over. The rule puts the sidebar where a closed drawer waits.
   Fixed, a long column never lengthens the document, as an absolute sidebar
   in an unpositioned shell does. Moved rather than hidden, it keeps focus for
   the breakpoint's handler to move: Chromium takes focus from what
   `visibility: hidden` hides before that handler runs, and leaves it on the
   page's body.

5. Check the behaviour against the
   [catalog's list](catalog.md#behaviour-each-product-writes).
6. Bind the measures and tones that differ, then remove local shell rules only
   after comparing both schemes, desktop open and folded, the drawer on a phone,
   a window narrowed across the breakpoint, right to left, forced colours,
   reduced motion and touch. A product's unlayered rules beat the shell's
   layered ones whatever their specificity, so each local rule left in place
   still decides what it sets.

All three copies differ from the shared shell in the same few places:

- The K sits on the bar's centre line. The rail's head is now the bar's own
  height, inset by `--kin-shell-inset`; before, the K stood 2px above the
  bar's controls. The pages stay where they were; the column starts 4px higher
  and the rail's foot ends 4px lower.
- A closed drawer is hidden as well as inert, as Relay's already was. Under
  reduced motion it is not displayed, so an opening drawer takes focus at once
  even beside a host reset that only shortens transitions.
- A tip wraps beyond 18rem rather than running on. Beside the page Escape puts
  a showing tip away, which WCAG 1.4.13 asks: the product sets
  `data-tip="hidden"` on the item until the pointer or focus leaves it. In an
  open drawer Escape closes the drawer, its tips with it, and there the K
  names itself only to the keyboard, since it stands under the pointer that
  opened the drawer. Tips still never take the pointer, as in all three
  copies, so 1.4.13's other condition, that the pointer can rest on a tip, is
  not met: a tip that held the pointer lay over the fold, the column's rows and
  the page, and took the clicks meant for them.
- A change that hides what holds focus hands it to the fold or the menu:
  unfolding with focus on a mark, crossing into the drawer layout with focus
  on the fold, or widening onto a folded rail with focus in the column.
- The panel isolates what the page raises, so a page layer at the overlay or
  dialog layer no longer covers a tip or the open drawer. Keep toasts that
  must stand above the shell outside it, as Space does, or in the top layer.
- A window under 28rem tall scrolls the sidebar to reach its foot, as Space's
  already did, except a folded rail under a pointer that hovers, which keeps
  its tips. A product whose rail needs more height applies the same rule from
  its own. The drawer is as tall as `--kin-shell-height`, so a product that
  follows the visual viewport keeps the drawer's foot above the keyboard.

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

From `41b6301`: its shell from `bf05738`, its resizable column from `3e707d8`.

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
| `data-resizing` on the root                                    | `data-resizing` on the shell as well                                                                            |

Relay keeps its splitter, Space's brought to the column's edge, which writes
`--kin-shell-column` in place of `--relay-band`, still within the 40rem the
page keeps beside the rail, and sets `data-resizing` on the shell while it
drags. It keeps its palette, bound to the tone properties; the workspace head
and the Build list in the column; the account card and its placement; the
appearance control; freshness and Refresh at the bar's end; the cap of eight
pinned Builds; the narrower column from 60 to 75rem; page padding and
measure; the parts table's sticky offset, measured against the document while
the page scrolls with it; and the 60rem breakpoint that `wide()` shares, from
which it sets `data-drawer`.

What changes for Relay: the shell mirrors right to left, where Relay's drawer,
badges and padding were physical. In document scroll, Relay's root
`scroll-padding-top` can go, since the shell sets the same padding; with it,
Escape back to the menu or Shift+Tab into the bar scrolled the reader away.
The shared bar's controls reach back over the padding, and focus sent to them
uses `preventScroll`. Rail items are Space's 2.25rem rows rather
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
- **Kinra Space** pins **0.7.0** at exact commit
  `3708fc229556d57e80720b5f497d581581b80e2a`, with package-lock integrity,
  since its `a518d7ed` (2026-10-12), the commit that moved it onto the shared
  shell, including `wordmark-space.svg`. Space 0.20.0 (`v0.20.0`, `4c8934c7`)
  released it.
- **Kinra Home** pins **0.7.0** through `#v0.7.0`, resolved by its lockfile to
  `3708fc229556d57e80720b5f497d581581b80e2a`, since its `7412712` (2026-10-12),
  the commit that moved it onto the shared shell.
- **Kinra Relay** pins **0.7.0** through the public codeload archive of
  `3708fc229556d57e80720b5f497d581581b80e2a`, with package-lock integrity, since
  its `a30c757` (2026-10-12), and has used the shared shell since its `e427875`.
- **Kinra Thread** pins **0.7.0** through `#v0.7.0`, resolved by its lockfile
  to `3708fc229556d57e80720b5f497d581581b80e2a`, since its first commit
  `097d7b3` (2026-11-13). It uses the shell's frame without the drawer or the
  fold.
  These four pins were read from each owner's manifest and lockfile on
  2026-11-20, in the local checkouts at Space `db1eeae3`, Home `8cfd070`,
  Relay `6d804088` and Thread `d4be2ad`; Space, Home and Relay are unchanged
  since 2026-10-12. Each consumer's package/lockfile owns its current revision
  and its own gates own upgrade evidence.
- **Kin** and **Scope** copy exact assets from `21327ae`, with provenance in
  each owning vendored manifest; neither gains a runtime dependency.

Site and Gateway retain their earlier exact test pins. Space, Home, Relay and
Thread use the shared application shell. Space's `4c8934c7` and Home's
`c6b18c6` give their stylesheets the breakpoint query that step 4 of
[Adopt the shell](#adopt-the-shell) asks for; Relay's does not yet, and Thread
sets neither the drawer nor the fold.
Retired Spaces and Kinra OS, and retiring Depot, retain earlier pins as
recovery evidence.
A consumer's own upgrade, verification and deployment remain independent.
