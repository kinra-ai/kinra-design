# Kinra design

Kinra's shared, framework-light visual foundation for simple web surfaces.
The package is consumed at build time; deployed sites remain self-contained.

## Start here

1. Check `git status --short --branch` and preserve existing work.
2. Read `README.md` and `docs/principles.md` before changing a public token or
   promoting a component.
3. Run `npm run check` before handing off a change.

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
- Do not publish or push without explicit approval.
