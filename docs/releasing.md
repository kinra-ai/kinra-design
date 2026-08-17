# Releasing `@kinra/web`

Releases are immutable Git tags. Consumers pin an exact tag and upgrade on
their own schedule. The package is not currently published to an npm registry.
[`STATUS.md`](../STATUS.md) names the latest immutable tag and any unreleased
development state.

## Versioning

The tag and `package.json` version always match. For example, package version
`0.3.0` requires tag `v0.3.0`.

- Patch releases fix implementation without removing or renaming public
  tokens, exports, assets, classes, recipes, or stable registry items.
- Minor releases add compatible capabilities. While the package remains below
  `1.0.0`, a deliberate breaking change also requires a minor release and an
  explicit migration note; it never rides in a patch.
- Candidate registry source may change before promotion because its status
  communicates that instability.
- A future `1.0.0` establishes conventional semantic-versioning expectations
  for the stable public contract.

Never move or replace a released tag. If a release is wrong, fix it forward in
a new version.

## Release gate

From a clean checkout:

```bash
npm ci
npm run verify
npm pack --dry-run
```

`npm run verify` checks the registry/export contract, Astro and TypeScript,
formatting, and the production reference build. Review the rendered catalog at
desktop and mobile widths, including keyboard focus and reduced motion.

Review the dry-run manifest. It should contain only public styles, assets,
registry source, guides, README, license, trademark terms, and package
metadata—not the reference site, scripts, development dependencies, or
generated output.

Confirm that:

1. `package.json` carries the intended version and Apache-2.0 declaration;
2. the reference catalog accurately demonstrates the public contract;
3. every registry item has evidence, guidance, source, and declared stable
   dependencies;
4. `CHANGELOG.md` moves release entries from `[Unreleased]` under the new
   version heading and `STATUS.md` reflects the new latest tag;
5. the working tree is clean after the release commit; and
6. the annotated tag matches the package version.

Then push the verified commit and its annotated tag. Creating or pushing a
release tag requires explicit maintainer approval. An npm publication, GitHub
Release, or consumer update is a separate action and is not implied by the
tag.

## Why there is no root `build` script

npm rebuilds Git dependencies that declare `build`, `prepare`, `prepack`, or
install lifecycle scripts. This package ships ready-to-consume CSS, SVG, HTML,
JSON, and Markdown source, so rebuilding the reference catalog during every
consumer installation adds cost and failure modes without changing the
installed package.

The reference command is therefore named `build:reference`, and `verify`
combines contract and type checks with that production build. Preserve this
distinction unless the package gains a real compilation step consumers need.
