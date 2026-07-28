# Consumer adoption

`@kinra/web` is a versioned, build-time dependency. It gives Kinra's small web
surfaces a shared visual vocabulary without making their routes, content, or
deployments depend on one repository.

## The contract

This package owns:

- role-named tokens and the Graphite+ palette
- accessibility and reduced-motion foundations
- canonical Kinra marks
- scoped prose, canvas, surface, button, and status primitives
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
  <main class="kin-prose"><slot /></main>
</body>
```

The current public primitive classes are:

- `.kin-canvas`
- `.kin-surface`
- `.kin-eyebrow`
- `.kin-button`, `.kin-button--primary`, and `.kin-button--quiet`
- `.kin-status` with `data-state="running|success|warning|error"`
- `.kin-prose`
- `.kin-sr-only`

Site CSS should load after the package and may override role tokens rather than
copying their values. For example, Learn can retain its mono reading voice:

```css
:root {
  --kin-font-prose: var(--kin-font-mono);
}
```

## Update a consumer

1. Read the design release and its rendered reference surface.
2. Change the exact tag in the consumer's `package.json`.
3. Run `npm install` to update the lockfile.
4. Build and visually verify the consumer at desktop and mobile widths,
   including keyboard focus and reduced motion.
5. Commit and deploy from the consumer repository on its own schedule.

There is no automatic fleet-wide rollout. A tag can coexist across consumers
for as long as each site needs.

## First adoption: `kinra-learn`

Begin this work from the `kinra-learn` repository so its own instructions,
content history, and deployment remain authoritative.

1. Read that repository's `AGENTS.md` or `CLAUDE.md` and preserve the existing
   lesson content and visual behavior.
2. Create a static Astro application. Give lessons real routes and model the
   Markdown curriculum as an Astro content collection.
3. Install `@kinra/web` at `v0.1.0` and import the complete foundation from the
   root layout.
4. Keep Learn's lesson navigation, progress, table of contents, content model,
   and deployment in `kinra-learn`. Replace duplicated palette, spacing,
   reset, prose, button, and brand-asset definitions with package roles.
5. Keep a style local when it serves only Learn. Propose moving it here only
   after another real consumer demonstrates the same stable responsibility.
6. Verify direct lesson URLs, browser back/forward, keyboard navigation,
   reduced motion, narrow mobile layout, and the static production build.

After Learn is stable, use the differences uncovered by that migration to
refine the package before adopting it in Get or creating a Starlight adapter
for Docs. Do not make the current MkDocs surface consume the full global
stylesheet as an interim shortcut.
