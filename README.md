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

## Install

Until an npm release is useful, pin the Git repository to a tag or commit:

```json
{
  "dependencies": {
    "@kinra/web": "github:kinra-ai/kinra-design#<tag-or-commit>"
  }
}
```

The package name and exports are already npm-compatible, so moving to a public
registry later will not require changing imports.

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

## Develop

```bash
npm install
npm run dev
npm run check
npm run build
```

The reference site lives in `examples/reference`. The distributable package is
limited by `files` in `package.json`; the example and toolchain are not shipped
to consumers.

See [`docs/principles.md`](docs/principles.md) for the design contract and the
rules for growing the package.

## License

The software and documentation are licensed under the
[Apache License 2.0](LICENSE). The license does not grant permission to use
Kinra's project and brand identifiers beyond the uses described in
[`TRADEMARKS.md`](TRADEMARKS.md).
