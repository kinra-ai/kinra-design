# Kinra design

Kind: product · Lifecycle: active · Versioning: semver

Kinra's shared, framework-light visual foundation for simple web surfaces.
The package is consumed at build time; deployed sites remain self-contained.
Real consumers pin an exact release or commit: `kinra-site` and `kinra-os`
pin the exact pre-`0.2.0` commit `2089818`, and `depot` vendors the `v0.1.0`
tag (see `depot/internal/server/static/kinra/VENDORED.md`); see `STATUS.md`
for current release and adoption state.

## Start here

1. Check `git status --short --branch` and preserve existing work. Read
   `STATUS.md` for current release and adoption state.
2. Read `README.md` and `docs/principles.md` before changing a public token or
   promoting a component. Read `docs/adoption.md` or `docs/releasing.md` when
   changing the consumer or release contract.
3. Run `npm run verify` before handing off a change (`npm run check` alone
   for a docs-only change).

## Boundaries

- This repository owns role-named tokens, brand assets, low-level styles,
  generic components, and compatibility adapters.
- Consumer repositories own routes, copy, product claims, content, analytics,
  deployment configuration, and release artifacts.
- Add a shared component after two real consumers demonstrate the same need.
  Until then, keep the implementation with the consumer.
- Keep the CSS entry points framework-independent. Astro may provide the
  reference site and optional components, but tokens and base styles must not
  require an Astro runtime.
- Use `kin-` for custom properties and public class names. Avoid unscoped
  component selectors.
- Name colour by role, not hue. Colour is information and should remain
  reserved for signal, reasoning, success, warning, and failure.
- Motion must explain causality, progress, or spatial change. Settled state is
  static, and reduced motion retains equivalent meaning.
- `build:reference` is intentionally not named `build`. npm treats a Git
  dependency with a `build`, `prepare`, `prepack`, or install lifecycle script
  as source that must be rebuilt during installation. Do not add one of those
  scripts without reviewing that consumer cost.
- Released tags are immutable and match the version in `package.json`.
  Consumers pin an exact tag and upgrade deliberately; never make `main` or a
  floating range their production dependency.
- Do not publish or push without explicit approval.
