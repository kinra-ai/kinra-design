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
- candidate source patterns with evidence and accessibility guidance; and
- future compatibility adapters after real reuse earns them.

The consumer owns:

- routes and information architecture;
- curriculum, documentation, product copy, and claims;
- product-specific layout, workflow, state, and interaction;
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
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.4.0"
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
copying values. The complete class and data-value contract lives in
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
- **Kinra Space** pins an exact verified development commit through the
  public GitHub Git URL, including `wordmark-space.svg`. Its `package.json`
  and lockfile own the current revision; its gate and visual comparisons own
  the upgrade evidence.
- **Kin** and **Scope** copy exact assets from `21327ae`, with provenance in
  each owning vendored manifest; neither gains a runtime dependency.

Current consumer pins predate `v0.3.0`; their exact development commits remain
valid until each owner reviews its upgrade.
Retired Spaces and Kinra OS, and retiring Depot, retain earlier pins as
recovery evidence.
A consumer's own upgrade, verification and deployment remain independent.
