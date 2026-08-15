# Releasing `@kinra/web`

Releases are immutable Git tags. Consumers pin an exact tag and upgrade on
their own schedule. The package is not currently published to an npm registry.
The current source prepares `0.2.0`; `v0.1.0` remains the latest immutable tag
until that release is explicitly approved.

## Versioning

The tag and `package.json` version always match: package version `0.2.0` is tag
`v0.2.0`.

- Patch releases fix the implementation without removing or renaming public
  tokens, exports, assets, or classes.
- Minor releases add compatible capabilities. While the package remains below
  `1.0.0`, a deliberate breaking change also requires a minor release plus an
  explicit migration note; it never rides in a patch.
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

Review the dry-run manifest. It should contain only the public styles, assets,
guides, README, license, trademark terms, and package metadata—not the
reference site, development dependencies, or generated output.

Confirm that:

1. `package.json` carries the intended version and Apache-2.0 declaration.
2. the reference build accurately demonstrates the public contract
3. the working tree is clean after the release commit
4. the annotated tag matches the package version

Then push the verified commit and its tag:

```bash
git push origin main
git tag -a v0.2.0 -m "@kinra/web v0.2.0"
git push origin v0.2.0
```

Creating or pushing a release tag requires explicit maintainer approval. An
npm publication, GitHub Release, or automatic consumer update is a separate
action and is not implied by pushing the tag.

## Why there is no root `build` script

npm rebuilds Git dependencies that declare `build`, `prepare`, `prepack`, or
install lifecycle scripts. This package ships ready-to-consume CSS and SVG
source, so rebuilding the reference site during every consumer install adds
cost and failure modes without changing the installed package.

The reference command is therefore named `build:reference`, and `verify`
combines the type/format checks with that production build. Preserve this
distinction unless the package eventually gains a real compilation step that
consumers require.
