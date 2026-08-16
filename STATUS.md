# Status

Present-tense operational truth for `@kinra/web`. See
[`docs/releasing.md`](docs/releasing.md) for the release gate and
[`docs/adoption.md`](docs/adoption.md) for the full consumer contract and
adoption map; this file only tracks current state, not process.

## Release

- Latest immutable tag: `v0.2.0` (2026-08-16, Graphite+ alignment with Kinra
  Site; approved by Blake). `package.json` matches the tag.
- Prior release: `v0.1.0` (`7a367ac`).

## Adoption

- **kinra-site** and **kinra-os** each pin the exact pre-`0.2.0` commit
  `2089818` — a deliberate test pin, not `main`.
- **depot** vendors the released `v0.1.0` tag verbatim into
  `internal/server/static/kinra/`, with provenance recorded in that
  directory's `VENDORED.md`.
- No consumer has adopted `v0.2.0` yet; each upgrade is that consumer's
  deliberate action.

## Next event

Consumer upgrades to `v0.2.0`, each through the owning repository's own
change process.
