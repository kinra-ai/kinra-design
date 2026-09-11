# Changelog

All notable changes to `@kinra/web` are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
the pre-1.0 discipline in [`docs/releasing.md`](docs/releasing.md). See
[`STATUS.md`](STATUS.md) for current release and adoption state.

## [Unreleased]

### Added

- Add the masthead treatment to `docs/brand.md`: where a surface introduces
  the product at rest, the K leads at the height of the text block beside
  it rather than at one line of interface text, with no hairline. The
  lockup remains the rule for chrome.
- Add a reference-only examples page with a filterable collection and
  inspectors, reading preferences with a live preview, and an interactive
  review checklist. Option cards remain a local experiment.
- Add control-edge, control-radius, and neutral hover roles.

- Resolve every colour role through `light-dark()` and add the paper scheme;
  `data-kin-scheme="light|dark|auto"` switches the ground for a document or
  any bounded subtree.
- Add the serif voice, the `--kin-font-display` role, and
  `data-kin-voice="serif|mono|sans"` for a bounded region.
- Add the `learning` surface recipe.
- Add `type.css` with display, title, headline, subhead, heading, quiet, lede,
  body, caption, label, mono, tabular, and truncate roles.
- Add `navigation.css` with tabs, breadcrumb, pagination, rail navigation,
  toolbar, and steps.
- Add `feedback.css` with progress, meter, spinner, skeleton, toast, keyboard
  hint, and tooltip.
- Add `overlays.css` with native dialog, drawer, popover, and menu treatment.
- Add `data.css` with figure, key-value list, log, code block, avatar, card,
  and list.
- Add chip, switch, range, segmented control, input group, fieldset, notice
  actions, table numeric alignment, selected rows, sticky headers, and the
  panel disclosure variant to `components.css`.
- Add ghost, danger, icon, compact, large, full-width, pressed, and grouped
  button treatments; sunken and plain surfaces; the corner mark on toned
  surfaces; and ledger, labeled, vertical, and brand rules to `canvas.css`.
- Add center, cover, switcher, reel, and bar compositions, fixed grid column
  counts, hairline grids, and region rules to `compositions.css`.
- Add brand gradient, signal tint and edge, layer, control height, measure,
  leading, and motion tokens.
- Add prose treatment for description lists, keyboard hints, marks,
  abbreviations, figures, and captions.
- Add `docs/composing.md`, a guide to choosing axes and elements for a page.
- Add navigation, feedback, data, and overlay pages and a scheme switch to the
  reference catalog.
- Extend the contract check to enforce the `kin-` namespace on every class,
  custom property, keyframe, and cascade layer in shipped styles.
- Add `docs/brand.md`, the settled naming and marking standard, and
  `.kin-lockup`: the K, a hairline, and the product name as text, worn by
  the reference catalog.
- Add framework-independent stack, cluster, grid, split, sidebar, and region
  compositions.
- Add shared badges, notices, form fields, controls, tables, empty states, and
  native disclosure treatment proven across operating surfaces.
- Add opt-in editorial, documentation, operations, and application surface
  recipes.
- Add a checked, source-owned registry with narrative intro, editorial
  feature, and operations region candidate patterns.
- Replace the single reference page with a responsive catalog for foundations,
  compositions, components, patterns, and surface recipes.
- Add the public contract catalog and registry adoption guidance.

### Changed

- The brand standard's terminal clause now draws the K from the asset where
  the terminal offers an image protocol, instead of assuming it can never be
  drawn, and names block and ASCII approximations as redrawings that no
  consumer makes.

- Refine the paper ground and deepen its text roles for tinted selections;
  raise small type to 12/14px and align control corners and sizing.
- Align the catalog navigation, section spacing, specimen descriptions,
  and responsive layouts; link the overview to the working examples.
- Keep disabled button variants stable on hover, preserve select carets on
  focus, reserve caret space in compact selects, and make large figures and
  icon buttons respect their requested size.
- Keep keyboard focus visible inside scrolling tabs and menus, keep
  secondary actions usable within stretched links, and preserve static
  feedback when motion is reduced, including standalone CSS imports.
- Scope voice changes to headings and display type, and let prose follow
  the recipe's leading role.

- Make badges, status markers, avatars, and switch thumbs square, and lead
  the eyebrow with a square mark in sentence case, so the wordmark's block
  geometry is the system's single ornament.
- Bring display, title, and section type down to reading scale, open the
  tracking, and give the editorial recipe a serif display voice; see "Moving
  from 0.2 to the unreleased expansion" in
  [`docs/adoption.md`](docs/adoption.md).
- Open every reference catalog page with a plain title and one sentence
  instead of an eyebrow, statement, and lede, and remove the overview hero.
- Give the unmodified `.kin-button` a stronger neutral border and hover.
- Declare the cascade layer order explicitly in `base.css`.
- Promote the narrative intro's evidence list to the shared `.kin-kv` and let
  registry patterns use shared type roles.
- Amend the abstraction principle: generic control vocabulary is shared early
  with two-consumer evidence, because a narrow vocabulary produces sameness.
- Broaden the repository boundary from small public surfaces to Kinra web
  products while preserving consumer ownership of routes, copy, workflows,
  and product-specific composition.
- Reserve numbering for real sequence, progression, reference, or identity
  rather than default section decoration.
- Integrate form-control focus outlines with the control edge so focus remains
  explicit without rendering a second disconnected border.

### Removed

- Remove the facet, flow, learn, outpost, paddock, scope, and spaces
  wordmarks and the Facet mark from `assets/`. Products are marked with the
  lockup; grid letterforms and the gradient are reserved for the K and the
  Kinra wordmark.

## [0.2.0] - 2026-08-16

### Changed

- Consolidate `.kin-canvas`, `.kin-frame`, `.kin-surface`, and `.kin-prose`
  toward the flatter treatment independently proven by Kinra Site and Depot.
  Full migration notes live in the "Moving from 0.1 to 0.2" section of
  [`docs/adoption.md`](docs/adoption.md).
- Add product wordmarks and the facet mark to `assets/`.

## [0.1.0] - 2026-07-28

Initial consumer contract release: role-named tokens, base/canvas/prose
styles, canonical brand assets, and the release and adoption contract
documented in `docs/adoption.md` and `docs/releasing.md`.

[Unreleased]: https://github.com/kinra-ai/kinra-design/compare/v0.2.0...main
[0.2.0]: https://github.com/kinra-ai/kinra-design/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kinra-ai/kinra-design/releases/tag/v0.1.0
