# Kinra design

Kinra's shared, framework-light design system for web products and public
surfaces. It carries the Graphite+ identity without coupling every product to
one generator, framework, or page template.

The system has five layers:

- role-named foundations for colour on two grounds, three typographic voices,
  spacing, motion, depth, and measure;
- opt-in layout compositions that establish relationships without styling
  content;
- accessible controls, wayfinding, feedback, evidence, and overlay components
  proven across real operating surfaces;
- surface recipes for editorial, documentation, learning, operational, and
  application work, with independent scheme and voice axes; and
- a source registry of candidate patterns that consumers copy and own.

Two optional additions sit beside them: a Svelte 5 layer,
`@kinra/web/svelte`, that writes the same markup and carries the behaviour
products otherwise write themselves, from the application shell to dialogs
and toasts ([`docs/svelte.md`](docs/svelte.md)); and `kinra-check-spacing`,
which holds a product's CSS to the spacing scale and radii it reads from
Design's tokens.

Routes, copy, product claims, workflows, analytics, deployment configuration,
and release artifacts stay with the repository that owns their outcome.

## Consumer model

`@kinra/web` is a build-time dependency. Each consumer pins an immutable tag
or exact test commit and emits its own CSS and assets. Deployed products never
depend on this repository, a CDN, or a shared runtime being available.

Stable package contracts require the same responsibility to have survived use
in at least two consumers. A registry pattern may enter as a clearly marked
candidate after one real consumer; copying it transfers ownership of the local
result to the consumer.

See [`docs/adoption.md`](docs/adoption.md) for the complete contract and current
adoption map.

## Install

The latest immutable release is `v0.8.0`:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.8.0"
  }
}
```

Run `npm install` and commit the consumer's lockfile. Pin an exact commit while
testing unreleased source; never ship `main`, a floating range, or a live CSS
CDN.

## Use

Import the complete system in a Kinra-owned surface:

```astro
---
import "@kinra/web/styles";
---
```

Or choose only the contracts a host can own safely:

```css
@import "@kinra/web/styles/tokens.css";
@import "@kinra/web/styles/compositions.css";
@import "@kinra/web/styles/components.css";
@import "@kinra/web/styles/overlays.css";
```

Apply a surface recipe, a ground, and a voice without adopting a page
template:

```html
<body class="kin-canvas" data-kin-surface="operations" data-kin-scheme="auto">
  <main class="kin-frame">
    <section data-kin-voice="serif"><!-- authored region --></section>
    <!-- product-owned composition -->
  </main>
</body>
```

Canonical assets and copyable registry source are exported too:

```astro
---
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---
```

A Svelte 5 product can write the same markup through components:

```svelte
<script lang="ts">
  import { Page, PageHead, Button } from "@kinra/web/svelte";
</script>

<Page>
  <PageHead title="Items" description="Everything the shop keeps in stock.">
    {#snippet actions()}<Button variant="primary">New item</Button>{/snippet}
  </PageHead>
</Page>
```

Check a product's spacing from its own check script:

```bash
npx kinra-check-spacing src
```

Product naming and mark use are settled in [`docs/brand.md`](docs/brand.md).
The complete public class, token, and recipe catalog lives in
[`docs/catalog.md`](docs/catalog.md). Registry use and ownership are documented
in [`registry/README.md`](registry/README.md).

## Develop

With mise activated, `mise install` selects the repository's locked Node 26
and npm 11.17 toolchain. The native `devEngines` contract rejects an incorrect
development runtime before npm installs, runs, or verifies the package.

```bash
mise install
npm ci
npx playwright install chromium webkit
npm run dev
npm run verify
npm pack --dry-run
```

The reference catalog lives in `examples/reference`, and `npm run dev` serves
it from there. Run by an agent, Astro starts that server in the background;
`npm run dev -- status`, `npm run dev -- logs` and `npm run dev -- stop` find
it. The distributable package
is limited by `files` in `package.json`; it includes public styles, assets,
guides, and registry source, but not the example, scripts, toolchain, or
generated output. `build:reference` is deliberately not called `build` so Git
consumers do not rebuild the catalog during installation.

Open `/examples/` in the catalog for interactive collection, preferences, and
review examples. These reference-only compositions demonstrate the shared
styles without adding speculative package contracts.

Open `/shell/` for the application shell that Kinra Space, Kinra Home and
Kinra Relay share: the sidebar open, folded and as a drawer, on both grounds
and right to left, with the behaviour each product writes. It is
`@kinra/web/styles/shell.css`, new in 0.7.0.

Open `/applications/` for two reference-only application compositions: a
top-navigation collection and a navigation region beside a review surface.
Version 0.6.0 selects sans application UI, headings and display; 0.5.1 retains
mono UI. The [migration guide](docs/adoption.md#moving-to-06-application-typography)
includes the explicit mono override and consumer verification boundary.

`npm run verify` includes local-only Chromium and WebKit checks. After a fresh
install, install their engines as above (and Playwright's OS dependencies where
needed). `npm run test:browser` reruns the tests against source styles and the
last reference build; rebuild first after changing examples. No browser tooling
is shipped to consumers.

Open `/motion/` to see every motion term in both registers, the curves they
run on, signatures, and eleven corrections from Kinra Observatory, Space and
Design rebuilt from their commits, each measured against the rule it breaks
or keeps. Slow the page to a tenth, or simulate less motion. Its calibration
page, `/motion/calibrate/`, compares a token with a proposed value for a
review round; a value changes only in `tokens.css`.

Open `/refresh/` to review the styling brought back from Kinra Space: soft
layers on both grounds, quieter controls, the corner key's states and motion,
labelled corner confirmations, and the live edge. All three are source to
copy and own: the corner key and corner action remain candidates, and the
live edge is stable; the shared defaults and migration notes are documented
in [`docs/adoption.md`](docs/adoption.md).

Read the focused guides for the work at hand:

- [`docs/principles.md`](docs/principles.md) — visual and abstraction doctrine
- [`docs/catalog.md`](docs/catalog.md) — public layers and contracts
- [`docs/composing.md`](docs/composing.md) — choosing axes and elements for a page
- [`docs/motion.md`](docs/motion.md) — the motion vocabulary, its registers and checks
- [`docs/adoption.md`](docs/adoption.md) — installing and integrating a release
- [`docs/releasing.md`](docs/releasing.md) — versioning, verification, and tags
- [`STATUS.md`](STATUS.md) — current release and adoption state
- [`CHANGELOG.md`](CHANGELOG.md) — notable changes per release

## License

The software and documentation are licensed under the
[Apache License 2.0](LICENSE). The license does not grant permission to use
Kinra's project and brand identifiers beyond the uses described in
[`TRADEMARKS.md`](TRADEMARKS.md).

The Kinra Mono, Kinra Sans and Kinra Serif fonts in `assets/fonts/` are licensed under the SIL Open Font
License 1.1 ([`OFL.txt`](assets/fonts/OFL.txt)), with no Reserved Font Names.
