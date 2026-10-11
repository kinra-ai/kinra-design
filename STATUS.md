# Status

Present-tense operational truth for `@kinra/web`. See
[`docs/releasing.md`](docs/releasing.md) for the release gate and
[`docs/adoption.md`](docs/adoption.md) for the full consumer contract and
adoption map; this file only tracks current state, not process.

## Release

- Latest immutable tag: `v0.6.0` (2026-10-11, sans application language,
  reference-only compositions and development dependency remediation; commit,
  push and release explicitly authorized by Blake).
  `package.json` and both root lockfile versions match 0.6.0. Consumer upgrades
  remain separate; no npm registry publication or deployment is implied.
- Prior releases: `v0.5.1` (2026-10-10, Kinra Mono's terminal drawing from
  Kinra Type 0.2.0; authorized by Blake), `v0.5.0` (2026-10-10, Kinra Sans and Kinra Serif;
  authorized by Blake), `v0.4.0` (2026-10-10, Kinra Mono and grid hairlines;
  authorized by Blake), `v0.3.0` (2026-10-05, design-system expansion and Space
  refresh; coordinated release authorized by Blake), `v0.2.0` (2026-08-16,
  Graphite+ alignment with Kinra Site; approved by Blake) and `v0.1.0`
  (`7a367ac`).
- A release is a tag, not a deployment: no build output, host, route, or
  registry publication sits behind it, so this repository owns no deploy
  command. Each consumer deploys its own site from the version it pins.

## Development

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
  is promoted before a second consumer. `/refresh/` demonstrates both grounds,
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
- **kinra-space** pins Design 0.5.1 at `f400129c85e836a966e1097987586a9401ead829`.
- **kinra-home** pins Design 0.5.0 at `864d538abfd66bc934c0e042374e2686c2864cff`.
  Both were checked on 2026-10-11; their own package/lockfile and verification
  gates remain authoritative. Neither has adopted the 0.6.0 application update.
- **Kin** and **Scope** retain exact brand assets from `21327ae`; these are
  source copies recorded in their owning vendored manifests.
- Retired Spaces and Kinra OS pins, and retiring Depot's vendored copy,
  remain recovery evidence in their owners. Site and Gateway retain earlier
  test pins; adoption follows each owner's deliberate upgrade.

## Dependency audit

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

Adopt `v0.6.0` deliberately in separate Space and Home sessions using the
immutable tag and its full peeled commit, after confirming both on canonical
GitHub. Their source/browser and installed-device verification remain OPEN
in their owners. Candidate registry promotion still requires a second consumer
and compatibility review; package renaming and the Space shell runtime are
outside this update.
