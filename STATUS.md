# Status

Present-tense operational truth for `@kinra/web`. See
[`docs/releasing.md`](docs/releasing.md) for the release gate and
[`docs/adoption.md`](docs/adoption.md) for the full consumer contract and
adoption map; this file only tracks current state, not process.

## Release

- Latest immutable tag: `v0.2.0` (2026-08-16, Graphite+ alignment with Kinra
  Site; approved by Blake). `package.json` matches the tag.
- Prior release: `v0.1.0` (`7a367ac`).
- A release is a tag, not a deployment: no build output, host, route, or
  registry publication sits behind it, so this repository owns no deploy
  command. Each consumer deploys its own site from the version it pins.

## Development

- `main` contains an unreleased, additive design-system expansion: layout
  compositions, generic operating components, surface recipes, a source-owned
  candidate registry, and a multi-page reference catalog.
- `package.json` remains at the latest released version until a maintainer
  explicitly approves the next release identity and tag.

## Adoption

- **kinra-site** pins the exact pre-`0.2.0` commit `2089818` — a deliberate
  test pin, not `main`.
- **depot** vendors the released `v0.1.0` tag verbatim into
  `internal/server/static/kinra/`, with provenance recorded in that
  directory's `VENDORED.md`.
- Retiring **kinra-os** retains its exact historical lockfile pin in its own
  source as recovery evidence, but is no longer a current consumer under
  accepted PP-0020. No package release or byte change is required.
- No consumer has adopted `v0.2.0` yet; each upgrade is that consumer's
  deliberate action.

## Next event

Maintainer review of the unreleased package expansion and its next release
identity. Consumer version upgrades remain separate changes in their owning
repositories.
