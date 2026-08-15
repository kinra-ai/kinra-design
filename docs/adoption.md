# Consumer adoption

`@kinra/web` is a versioned, build-time dependency. It gives Kinra's small web
surfaces a shared visual vocabulary without making their routes, content, or
deployments depend on one repository.

## The contract

This package owns:

- role-named tokens and the Graphite+ palette
- accessibility and reduced-motion foundations
- canonical Kinra marks
- scoped frame, prose, canvas, surface, button, and status primitives
- future generic components and generator adapters after real reuse earns them

The consumer owns:

- routes and information architecture
- curriculum, documentation, product copy, and claims
- site-specific layout and interaction
- analytics, deployment configuration, and release artifacts

The dependency exists only during installation and build. The generated site
contains its own CSS and assets and does not contact GitHub or this repository
at runtime.

## Install an exact release

The current package requires Node.js 22.12 or newer. Add the public HTTPS Git
dependency to the consumer's `package.json`:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.1.0"
  }
}
```

Then run `npm install` and commit the resulting lockfile. Use an immutable
release tag, or a full commit SHA while testing an unreleased change. Never
ship a dependency on `main`, a floating version range, a local path, or a live
CSS CDN.

## Choose the integration depth

| Entry point                                     | Provides                                                    | Best fit                                                    |
| ----------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `@kinra/web/styles`                             | tokens, reset, body defaults, canvas, prose, and primitives | a Kinra-owned Astro surface starting from this foundation   |
| `@kinra/web/styles/tokens.css`                  | custom properties only                                      | a host theme or adapter that owns its reset and structure   |
| `@kinra/web/styles/base.css`                    | tokens plus reset and global element defaults               | a custom shell that does not need the canvas or prose rules |
| `@kinra/web/styles/canvas.css`                  | tokens plus opt-in canvas and primitive classes             | adding Kinra surfaces without global element defaults       |
| `@kinra/web/styles/prose.css`                   | tokens plus scoped `.kin-prose` typography                  | lessons, guides, and documentation content                  |
| `@kinra/web/assets/mark.svg` and `wordmark.svg` | canonical brand assets                                      | headers, favicons, and metadata                             |

For a new Astro surface, import the complete foundation once in its root
layout:

```astro
---
import "@kinra/web/styles";
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---

<body class="kin-canvas">
  <header><img src={wordmarkUrl} alt="Kinra" /></header>
  <main class="kin-frame kin-prose"><slot /></main>
</body>
```

The current public primitive classes are:

- `.kin-canvas`
- `.kin-frame`
- `.kin-surface` and the explicit `.kin-surface--raised` modifier
- `.kin-eyebrow`
- `.kin-button`, `.kin-button--primary`, and `.kin-button--quiet`
- `.kin-status` with `data-state="reason|running|success|warning|error"`
- `.kin-prose`
- `.kin-sr-only`

The frame uses `--kin-measure-wide` and `--kin-page-gutter`. Fluid display,
title, and section roles are available as `--kin-text-display`,
`--kin-text-title`, and `--kin-text-section`, with matching weight, leading,
and tracking roles. A consumer may override these roles without copying the
foundation's values.

Site CSS should load after the package and may override role tokens rather than
copying their values. For example, Learn can retain its mono reading voice:

```css
:root {
  --kin-font-prose: var(--kin-font-mono);
}
```

## Moving from 0.1 to 0.2

The `0.2.0` source deliberately consolidates patterns proven independently by
Kinra Site and Depot:

- `.kin-canvas` replaces the grid and ambient glows with one quiet top wash;
- `.kin-frame` owns the repeated 82rem measure and responsive page gutter;
- `.kin-surface` becomes square, flat, and rule-bound by default, while
  `.kin-surface--raised` opts into radius and shadow;
- `.kin-prose` uses the flatter editorial treatment for quotations, code
  blocks, tables, and rules;
- buttons no longer lift decoratively on hover; running state remains the only
  looping shared motion.

When upgrading, remove local canvas and frame copies only after visual review.
Add `.kin-surface--raised` anywhere the old elevated treatment carries real
meaning. Pin the release or an exact test commit and verify desktop, mobile,
keyboard focus, and reduced motion before deployment.

## Update a consumer

1. Read the design release and its rendered reference surface.
2. Change the exact tag in the consumer's `package.json`.
3. Run `npm install` to update the lockfile.
4. Build and visually verify the consumer at desktop and mobile widths,
   including keyboard focus and reduced motion.
5. Commit and deploy from the consumer repository on its own schedule.

There is no automatic fleet-wide rollout. A tag can coexist across consumers
for as long as each site needs.

## Current adoption map

- **Kinra Site** is the public reference consumer. It pins an exact design
  commit, imports the complete foundation once, and owns its field-guide
  composition, public routes, documentation shell, curriculum rendering, and
  deployment. Kinra Learn remains the authority for lesson text; it is not a
  second public renderer.
- **Depot** vendors an exact released copy so its self-contained Go binary does
  not acquire a runtime dependency. Its `depot-` app layer owns forge-specific
  layout and interaction. Re-vendoring remains a deliberate consumer update.
- **Kinra OS** pins an exact design commit for roles and primitives while
  retaining an immersive, application-specific shell. Its grid and ambient
  field serve a different job and are not evidence that the public canvas
  should regain decorative motion or texture.

The quiet canvas and responsive frame moved here only after Kinra Site and
Depot implemented the same values independently. Route shells, documentation
rails, product showcases, forge tables, and operating controls remain with
their consumers until another implementation demonstrates the same stable
responsibility.
