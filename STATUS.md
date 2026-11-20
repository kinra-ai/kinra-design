# Status

Present-tense operational truth for `@kinra/web`. See
[`docs/releasing.md`](docs/releasing.md) for the release gate and
[`docs/adoption.md`](docs/adoption.md) for the full consumer contract and
adoption map; this file only tracks current state, not process.

## Release

- Latest immutable tag: `v0.7.1` (2026-11-14, Kinra Type 0.2.1's ampersand
  and Sans spacing refinements, and the previously unreleased shell guide
  and first-paint correction). Blake authorized the Type release, font
  adoption and Design release. `package.json` and both root lockfile
  versions match 0.7.1. Each consumer upgrades its own exact dependency;
  no npm registry publication or deployment is implied.
- Prior releases: `v0.7.0` (2026-10-12, shared application shell and
  accessibility fixes; authorized by Blake), `v0.6.0` (2026-10-11, sans application language,
  reference-only compositions and development dependency remediation;
  authorized by Blake), `v0.5.1` (2026-10-10, Kinra Mono's terminal drawing from
  Kinra Type 0.2.0; authorized by Blake), `v0.5.0` (2026-10-10, Kinra Sans and Kinra Serif;
  authorized by Blake), `v0.4.0` (2026-10-10, Kinra Mono and grid hairlines;
  authorized by Blake), `v0.3.0` (2026-10-05, design-system expansion and Space
  refresh; coordinated release authorized by Blake), `v0.2.0` (2026-08-16,
  Graphite+ alignment with Kinra Site; approved by Blake) and `v0.1.0`
  (`7a367ac`).
- A release is a tag, not a deployment: no build output, host, route, or
  registry publication sits behind it, so this repository owns no deploy
  command. Each consumer deploys its own site from the version it pins.

## Verification of 0.7.1

- A fresh `npm ci`, `npm run verify`, `npm audit` and `npm pack --dry-run`
  pass on the pinned Node 26/npm 11.17 toolchain. The gate includes the
  public contract, Astro/type checks, formatting, production reference build
  and 102 Chromium/WebKit browser cases. The dependency audit reports zero
  vulnerabilities; the package manifest contains 59 public files, including
  all five fonts, `OFL.txt` and their exact source/hash provenance, and
  excludes the reference site, browser tests and development tools.
- The adopted woff2 files match Type 0.2.1's frozen release files byte for
  byte. Type's release passes 372 structural and 212 real build tests;
  every glyph, advance and feature matches its checked refinement at nine
  weights. The release's source commit and SHA-256 hashes are recorded in
  `assets/fonts/VENDORED.md`.

## Development

- **Edges by meaning (unreleased, prepared for 0.8.0; 2026-11-20):** Kinra
  Relay's polish pass found the notice's edge, the live edge's line round both
  leading corners, reading as a bracket, and drew its still accents as a bar
  set in from the start. Blake kept both shapes and gave each one meaning: a
  line along an edge is work in flight, a still block's tone is the bar, and
  the square marks state rather than every small thing. Notices and toasts
  draw the bar (`--kin-tone-bar-width`, new), a switch's track takes the
  control radius with its thumb nested, and the principles, catalog,
  composing guide and refresh plan say which shape means what. The live edge
  is a stable registry pattern after a review of both consumers' copies (its
  README records it). No class, attribute or export is renamed or removed;
  `docs/adoption.md` has the per-product notes. Not released; consumers keep
  their pins.

- **Fonts (0.7.1, 2026-11-14):** all five woff2 files and `OFL.txt` come
  from Kinra Type `v0.2.1`, on Blake's authorization. The ampersand is clearer
  in every style; Sans upright and italic have more even shape-based spacing,
  with accented forms and mark anchors fitted together. Sans sample words
  average 4.0% narrower, so text may reflow. Word spaces, tabular figures,
  coverage, vertical metrics and every font URL retain their contract.
  `assets/fonts/VENDORED.md` records the source tag, commit and file hashes.

- **Shell first paint (released in 0.7.1; developed 2026-10-12):** Space's adoption found that below
  its breakpoint the page lays out before `data-drawer` arrives: at its first
  paint, and in any layout a resize reads before the breakpoint's change. The
  sidebar then stood beside the page as a column and left it a sliver, and
  WebKit kept the heights laid out there. Design's own demo painted its first
  frame at a phone's width that way, the page 54px wide, in both engines. The
  catalog's Layout step and the guide's step 4 now ask each product's
  stylesheet for its breakpoint's query, putting a sidebar not yet a drawer
  where a closed drawer waits. It is fixed, since an absolute sidebar in an
  unpositioned shell made the document as tall as its column, and moved
  rather than hidden, since Chromium took focus from a hidden rail to the body
  before the breakpoint's handler could hand it to the menu. The demo does so,
  with a check in both engines. `shell.css` is unchanged, so consumers apply
  it without a release.
- **Application shell (0.7.0):** on 2026-10-12 Blake
  asked for the collapsible sidebar shell that Kinra Space, Kinra Home and
  Kinra Relay each implement to become one shared, stable contract, and
  approved the proposed contract, its names and a documented behaviour
  contract (rather than a shared helper) the same day. `src/styles/shell.css`,
  in the complete stylesheet and its own `kinra.shell` layer, draws every
  state; products set its state attributes and write the behaviour that
  `docs/catalog.md` lists. `/shell/` frames each state and runs a
  framework-free reference of the behaviour, which is catalog source and not
  exported. Additive: no existing class, token, recipe default or registry
  status changes. Released in `v0.7.0`; each product adopts it in its own
  repository.
- **Fixes in 0.7.0 (2026-10-12):** at Blake's request `main` carries the
  `touch-toolbar-fields` branch (`6bb7bb4`: a toolbar's fields take the touch
  target its buttons have), with the shell's commits replayed on it. Reduced
  motion now removes transitions in `base.css` rather than shortening them, so
  a change lands in the frame that makes it and focus sent into a panel just
  shown arrives; `transitionend` no longer fires there. Drawers and a dialog's
  close keep to the line right to left. `npm run dev` serves the catalog from
  its own directory, since Astro 7's background start for agents mishandles a
  relative `--root`. A WebKit check that lost a click to smooth scrolling under
  load (one run in about 170) presses its button from the keyboard.
- **Reviews before 0.7.0 (2026-10-12):** two fresh-context adversarial
  reviews of the release's CSS and reference behaviour found seven defects
  and then four in their fixes; each is fixed with a check in both engines
  (`50ec47d`, `0253354`). Recorded limits: tips never take the pointer, so
  WCAG 1.4.13's condition that the pointer can rest on a tip is not met (a tip
  that held it took clicks meant for the fold and the column); the 28rem
  short-window rule is a heuristic a product with a taller rail extends; and
  a folded rail under a hovering pointer may cut off its foot in a short
  window.
- **Design verification (2026-10-12, the 0.7.0 release commit):** after
  `npm ci` and browser-engine setup, `npm run verify` passed: contract checks
  (14 style files), Astro/TypeScript (0 errors, warnings or hints),
  formatting, the 15-page reference build and 100 Chromium and WebKit cases,
  60 of them the shell's, with forced colours emulated in both engines; the
  suite also passed 400 runs at thirteen workers. Captures of each shell state
  were reviewed on both grounds, right to left and in forced colours.
  `npm pack --dry-run` lists 58 public files and `npm audit` reports zero
  vulnerabilities. This checks the shell in its own demo, not in any product.
- **Application update (0.6.0):** Blake approved sans by default and the minor
  release on 2026-10-11. Application UI, headings and display select sans, with
  a documented mono override; sizes, weights, other recipe defaults and registry
  statuses are unchanged. Two reference-only compositions at `/applications/`
  demonstrate page/section heads and collection states. Consumer verification
  remains separate; no consumer rollout is authorized.
- **Design verification (2026-10-11, prepared 0.6.0 working tree):** after the
  dependency patch and version bump, a fresh `npm ci`, browser-engine setup and
  `npm run verify` passed: contract checks, Astro/TypeScript (zero diagnostics),
  formatting, the 13-page build and 34 Chromium/WebKit cases. Browser coverage
  includes scope, mono overrides, example interactions, both schemes at
  desktop/phone widths, RTL/enlarged text, reduced motion and touch targets.
  Forced-colour checks run where the engine supports the mode. Fresh reference
  captures were inspected; `npm pack --dry-run` lists 57 public files, excluding
  examples, tests, tooling and generated output. `npm audit` reports zero
  vulnerabilities. The prior independent public-CSS review reported no findings;
  the reviewed public CSS is unchanged by this preparation. This is Design
  working-tree evidence, not a clean release-commit gate or consumer acceptance.

- `main` contains the released design-system expansion and refresh: a paper
  scheme beside graphite, serif and sans voices beside mono, type roles,
  layout compositions, generic control, navigation, feedback, overlay, and
  data components, five surface recipes, a source-owned candidate registry,
  and a reference catalog with a scheme switch. The refresh changes
  several defaults (square marks, sentence-case eyebrow, more open tracking,
  serif editorial display); the migration notes live in `docs/adoption.md`.
- The polish pass refines paper contrast, small text, control geometry,
  hover and focus states, responsive specimens, and reduced-motion feedback.
  Reference-only collection, preferences, and review examples demonstrate
  the shared styles together without adding registry or stable contracts.
- The coordinated review released the expansion as `0.3.0`.
- Kinra Mono comes from Kinra Type `v0.1.0`, tagged on its `cf5bda4` commit.
  Blake approved the release and this adoption on 2026-10-10. The variable
  woff2 and `OFL.txt` are copied unchanged from that build into
  `assets/fonts/`. `src/styles/tokens.css` declares the face, and
  `--kin-font-mono` names it first. It is released as `0.4.0`, and consumers
  keep their pins until they upgrade.
- Kinra Sans and Kinra Serif come from the same `v0.1.0` build (2026-10-10):
  the upright and italic variable woff2 of each, copied unchanged beside Mono
  in `assets/fonts/` and declared in `tokens.css`. `--kin-font-sans` and
  `--kin-font-serif` name them first. Blake approved the release on
  2026-10-10 and it is `0.5.0`; consumers keep their pins until they upgrade.
- Kinra Type `v0.2.0`, tagged on its `a9e9664` commit (2026-10-10), adds box
  drawing, block elements and braille to Kinra Mono; Sans and Serif leave
  them out. All five woff2 files are copied unchanged from that tag's build,
  and Kinra Sans and Kinra Serif differ from 0.1.0's only in their version
  names. Blake approved the release on 2026-10-10 and it is `0.5.1`.
- `0.4.0` also carries the grid hairlines (`data-rules="between"`), a chosen
  row drawn as a tint alone, table text aligned to the line's start, keyboard
  hints kept at the smallest text size, and a closed disclosure's arrow kept
  down inside an open one.
- The corner key refresh is brought back from Kinra Space at
  `8589b8a5b04f771b5ab0a3b7b4d3fb38d66d2663` (2026-09-30): soft layer roles,
  wells and quiet controls, sentence-case labels, signal edges, and causal
  motion tokens now live in the shared styles. The corner action, corner key,
  and live edge are candidate registry patterns with Space's evidence; none
  is promoted before a second consumer (the live edge was, on 2026-11-20,
  with Relay's). `/refresh/` demonstrates both grounds,
  all key faces without script, and interactive motion. The grammar, source
  boundary, and adoption state live in [`docs/refresh-plan.md`](docs/refresh-plan.md).
- The second Space polish port uses `0550b0e` (2026-10-01): compact touch
  controls, paragraph rhythm, rounded notice/toast edges, RTL disclosures and
  dialog spacing/focus are shared. Space verifies its exact consumer upgrade;
  all three registry patterns remain candidates. Release identity,
  tagging and other consumer upgrades remain separate.
- Depth for what floats comes from Kinra Space's decision 0078 (2026-10-03):
  an edge of its own tone (`--kin-float-ring`) and a short shadow, black on
  graphite. Foundations shows it on both grounds and on pure black. Space
  verifies its exact consumer upgrade; Site and Gateway keep their pins.
- `docs/brand.md` settles naming and marking (2026-09-11, Blake): one brand,
  Kin as the one unprefixed name, every product marked by `.kin-lockup`. The
  product wordmarks and the Facet mark are removed from `assets/`; Kinra
  Spaces replaces its wordmark with the lockup on its next upgrade. Kin's
  terminal welcome has one reviewed exception (2026-09-11, Blake): a compact
  cell rendering of the shared K, with live product text. Kinra Space has
  the one appointed product wordmark (2026-09-13, Blake, PP-0029):
  `assets/wordmark-space.svg`, the wordmark continued by `.␣` on its grid.

## Adoption

- **kinra-site** and **kinra-gateway** consume the public GitHub codeload
  archive at `21327ae489243316988019e6b6ca9a7737982699`, with lockfile
  integrity.
- **kinra-space** pins Design 0.7.0 at `3708fc229556d57e80720b5f497d581581b80e2a`,
  with lockfile integrity, and uses the shared shell, since its `a518d7ed`
  (2026-10-12). Its adoption found the page cramped below the breakpoint
  before `data-drawer` arrives (`cb97b472`), and its `4c8934c7` moves that
  guard's sidebar past the shell's start rather than hiding it. Space 0.20.0
  (`v0.20.0` at `4c8934c7`) carries both.
- **kinra-home** pins Design 0.7.0 through `#v0.7.0`, locked to
  `3708fc229556d57e80720b5f497d581581b80e2a`, and uses the shared shell, since
  its `7412712` (2026-10-12). Its `c6b18c6`, deployed on 2026-10-12, gives its
  stylesheet its breakpoint's query, as the guide's step 4 asks.
- **kinra-relay** pins Design 0.7.0 through the public codeload archive of
  `3708fc229556d57e80720b5f497d581581b80e2a`, with lockfile integrity, since
  its `a30c757` (2026-10-12), and uses the shared shell since its `e427875`.
  It confirmed both defects Design found in its copy: 0.7.0's reduced motion
  alone returned the narrow drawer's focus, and `a30c757` kept its bar's
  controls from scrolling the document until the shared shell took over. It
  has yet to give its stylesheet its breakpoint's query.
- **kinra-thread** pins Design 0.7.0 through `#v0.7.0`, locked to
  `3708fc229556d57e80720b5f497d581581b80e2a`, since its first commit
  `097d7b3` (2026-11-13). It uses the shell's frame without the drawer or the
  fold.
  All four were read from their manifests and lockfiles on 2026-11-20, in the
  local checkouts at Space `db1eeae3`, Home `8cfd070`, Relay `6d804088` and
  Thread `d4be2ad`; Space, Home and Relay are unchanged since 2026-10-12.
  Their own package/lockfile and verification gates remain authoritative.
- **Kin** and **Scope** retain exact brand assets from `21327ae`; these are
  source copies recorded in their owning vendored manifests.
- Retired Spaces and Kinra OS pins, and retired Depot's vendored copy,
  remain recovery evidence in their owners. Site and Gateway retain earlier
  test pins; adoption follows each owner's deliberate upgrade.

## Dependency audit

- The 0.7.1 release audit on 2026-11-14 found five affected development
  packages. Astro advances from 7.3.5 to 7.4.12; the lockfile refreshes the
  affected fast-uri, undici, Vite and Zod paths within their parent ranges.
  `npm audit` reports zero vulnerabilities. These tools are not shipped in
  the exported styles/assets package.

- Remediated on 2026-10-11: transitive development dependency `source-map-js`
  1.2.1 → 1.2.2 resolves GHSA-68fv-2mgg-jv7q (indexed source-map denial of
  service). Astro reaches it through css-tree, magicast and PostCSS; every
  existing parent range accepts the patch. Only this dependency's lock entry
  changed for the remediation; no override or broad tooling upgrade was needed.
  Version 1.2.1 also exists in the 0.5.1 baseline, before browser tooling was
  added. A fresh `npm ci` reports zero vulnerabilities. It is not a shipped
  runtime dependency.

## Open for the release review

- The package name `@kinra/web` predates the brand standard and undersells
  what the repository now owns. Renaming it, likely to `@kinra/design`,
  changes every consumer's import paths and Gateway's build banner. The `0.3.0`
  to `0.6.0` releases keep `@kinra/web`; a later rename requires its own
  coordinated migration.

## Next event

Blake reviews the edges-by-meaning change for release as 0.8.0; after it,
Relay removes its notice override and Space updates its switch wording as each
upgrades. Relay also gives its stylesheet its breakpoint's query,
`(max-width: 59.99rem)`, in its own repository, as the catalog's Layout step
asks. Design 0.7.1
carries the contract, guide and demo correction; `shell.css` is unchanged. Candidate registry promotion
still requires a second consumer and compatibility review; package renaming
stays outside this update.
