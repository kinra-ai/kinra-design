# Status

Present-tense operational truth for `@kinra/web`. See
[`docs/releasing.md`](docs/releasing.md) for the release gate and
[`docs/adoption.md`](docs/adoption.md) for the full consumer contract and
adoption map; this file only tracks current state, not process.

## Release

- Latest immutable tag: `v0.1.0` (`7a367ac`).
- `main` carries a prepared but unreleased `0.2.0` (Graphite+ alignment with
  Kinra Site). `package.json` already reads `0.2.0`; the `v0.2.0` tag does not
  exist yet and requires explicit maintainer approval before it is pushed.

## Adoption

- **kinra-site** and **kinra-os** each pin the exact pre-`0.2.0` commit
  `2089818` while the release is unreleased — a deliberate test pin, not
  `main`.
- **depot** vendors the released `v0.1.0` tag verbatim into
  `internal/server/static/kinra/`, with provenance recorded in that
  directory's `VENDORED.md`.
- No consumer has adopted the current `main` HEAD (`8442f6e`) yet.

## Next event

Tagging `v0.2.0` (or amending the manifest back to match `v0.1.0`) is a
maintainer decision, not implied by this status entry.
