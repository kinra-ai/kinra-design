# Kinra design

Kinra's shared design foundation for small public web surfaces. It carries the
Graphite+ identity without coupling every site to the same generator.

The package is build-time only. Astro, Starlight, or another consumer imports
the source it needs and emits a self-contained site; browsers never depend on
this repository being available.

## What belongs here

- role-named design tokens
- opt-in base, canvas, prose, and primitive styles
- canonical brand assets
- generic components once at least two real sites need the same abstraction
- thin adapters for generators such as Starlight
- a reference surface that makes the shared contract visible

Routes, site copy, curriculum, product claims, analytics, deployment files,
and release artifacts stay with the site that owns them.

## Consumer model

This repository is not deployed as a shared runtime or CDN. Each site installs
an exact release at build time, and Astro or the owning generator bundles the
selected CSS and assets into that site's own static output. A design release
therefore changes no live surface until that surface deliberately upgrades.

See [`docs/adoption.md`](docs/adoption.md) for the complete consumer contract,
including the first `kinra-learn` migration.

## Install

Until an npm registry release is useful, pin the public Git repository to an
immutable tag over HTTPS:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.1.0"
  }
}
```

Run `npm install` and commit the consumer's lockfile. HTTPS keeps public build
hosts credential-free. The package name and exports are already npm-compatible,
so moving to a public registry later will not require changing imports.

## Use

Import the complete, opinionated foundation in an Astro layout:

```astro
---
import "@kinra/web/styles";
---
```

Or integrate only the contract a host theme needs:

```css
@import "@kinra/web/styles/tokens.css";
@import "@kinra/web/styles/prose.css";
```

Assets are exported too:

```astro
---
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---

<img src={wordmarkUrl} alt="Kinra" />
```

Consumers should pin an exact tag or commit. Do not load shared CSS from a
live CDN or use a floating Git branch: every deployed site should be
reproducible and independently releasable.

The full import applies the Kinra reset, body defaults, ambient canvas, prose,
and primitives. Existing host themes should import only the pieces they can
own safely. The available entry points and site-by-site guidance live in
[`docs/adoption.md`](docs/adoption.md).

## Develop

```bash
npm ci
npm run dev
npm run verify
npm pack --dry-run
```

The reference site lives in `examples/reference`. The distributable package is
limited by `files` in `package.json`; it includes the public guides but not the
example, toolchain, or generated output. `build:reference` is deliberately not
called `build`: npm treats a Git dependency containing a root `build` script as
source that must be built during every installation, while this package already
ships consumable CSS and SVG source.

Read the focused guides for the work at hand:

- [`docs/principles.md`](docs/principles.md) — visual and abstraction doctrine
- [`docs/adoption.md`](docs/adoption.md) — installing and integrating a release
- [`docs/releasing.md`](docs/releasing.md) — versioning, verification, and tags

## License

The software and documentation are licensed under the
[Apache License 2.0](LICENSE). The license does not grant permission to use
Kinra's project and brand identifiers beyond the uses described in
[`TRADEMARKS.md`](TRADEMARKS.md).
