# Kinra design

Kinra's shared, framework-light design system for web products and public
surfaces. It carries the Graphite+ identity without coupling every product to
one generator, framework, or page template.

The system has five layers:

- role-named foundations for colour, type, spacing, motion, depth, and measure;
- opt-in layout compositions that establish relationships without styling
  content;
- accessible controls and states proven across real operating surfaces;
- surface recipes for editorial, documentation, operational, and application
  work; and
- a source registry of candidate patterns that consumers copy and own.

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

The latest immutable release is `v0.2.0`:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.2.0"
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
```

Apply a surface recipe without adopting a page template:

```html
<body class="kin-canvas" data-kin-surface="operations">
  <main class="kin-frame"><!-- product-owned composition --></main>
</body>
```

Canonical assets and copyable registry source are exported too:

```astro
---
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---
```

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
npm run dev
npm run verify
npm pack --dry-run
```

The reference catalog lives in `examples/reference`. The distributable package
is limited by `files` in `package.json`; it includes public styles, assets,
guides, and registry source, but not the example, scripts, toolchain, or
generated output. `build:reference` is deliberately not called `build` so Git
consumers do not rebuild the catalog during installation.

Read the focused guides for the work at hand:

- [`docs/principles.md`](docs/principles.md) — visual and abstraction doctrine
- [`docs/catalog.md`](docs/catalog.md) — public layers and contracts
- [`docs/adoption.md`](docs/adoption.md) — installing and integrating a release
- [`docs/releasing.md`](docs/releasing.md) — versioning, verification, and tags
- [`STATUS.md`](STATUS.md) — current release and adoption state
- [`CHANGELOG.md`](CHANGELOG.md) — notable changes per release

## License

The software and documentation are licensed under the
[Apache License 2.0](LICENSE). The license does not grant permission to use
Kinra's project and brand identifiers beyond the uses described in
[`TRADEMARKS.md`](TRADEMARKS.md).
