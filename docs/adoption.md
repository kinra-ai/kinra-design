# Consumer adoption

`@kinra/web` is a versioned, build-time dependency. It gives Kinra web
products a shared visual and interaction vocabulary without making routes,
content, workflows, or deployments depend on one repository.

## The contract

This package owns:

- role-named tokens and the Graphite+ palette;
- accessibility and reduced-motion foundations;
- canonical Kinra marks;
- scoped canvas, frame, prose, composition, component, and surface-recipe
  classes;
- candidate source patterns with evidence and accessibility guidance; and
- future compatibility adapters after real reuse earns them.

The consumer owns:

- routes and information architecture;
- curriculum, documentation, product copy, and claims;
- product-specific layout, workflow, state, and interaction;
- copied registry code after adaptation; and
- analytics, deployment configuration, and release artifacts.

The dependency exists only during installation and build. Generated products
contain their own CSS and assets and do not contact GitHub or this repository
at runtime.

## Install an exact release

The package requires Node.js 22.12 or newer. Add the public HTTPS Git
dependency to the consumer's `package.json`:

```json
{
  "dependencies": {
    "@kinra/web": "git+https://github.com/kinra-ai/kinra-design.git#v0.2.0"
  }
}
```

Run `npm install` and commit the resulting lockfile. Use an immutable release
tag, or a full commit SHA while testing unreleased source. Never ship a
dependency on `main`, a floating version range, a local path, or a live CSS
CDN.

## Choose the integration depth

| Entry point                          | Provides                                                      | Best fit                                            |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------- |
| `@kinra/web/styles`                  | complete opinionated system                                   | a Kinra-owned surface starting from this foundation |
| `@kinra/web/styles/tokens.css`       | custom properties only                                        | a host theme that owns reset and structure          |
| `@kinra/web/styles/base.css`         | tokens, reset, and global defaults                            | a custom shell without shared canvas or prose       |
| `@kinra/web/styles/canvas.css`       | quiet canvas, frame, and original primitives                  | a simple branded shell or compatibility import      |
| `@kinra/web/styles/compositions.css` | stack, cluster, grid, split, and sidebar                      | product-owned layouts using shared relationships    |
| `@kinra/web/styles/components.css`   | fields, notices, tables, disclosure, and empty states         | operating and application controls                  |
| `@kinra/web/styles/recipes.css`      | editorial, docs, operations, and application role adjustments | tuning density without adopting a template          |
| `@kinra/web/styles/prose.css`        | scoped `.kin-prose` typography                                | lessons, guides, and documentation                  |
| `@kinra/web/assets/*`                | canonical brand assets                                        | headers, favicons, and metadata                     |
| `@kinra/web/registry`                | pattern manifest and copyable source                          | product-owned higher-level composition              |

For a new Astro surface, import the complete system once in its root layout:

```astro
---
import "@kinra/web/styles";
import wordmarkUrl from "@kinra/web/assets/wordmark.svg?url";
---

<body class="kin-canvas" data-kin-surface="editorial">
  <header><img src={wordmarkUrl} alt="Kinra" /></header>
  <main class="kin-frame"><slot /></main>
</body>
```

Site CSS should load after the package and override role tokens rather than
copying values. The complete class and data-value contract lives in
[`catalog.md`](catalog.md).

## Copy a registry pattern

Registry source is a starting point rather than an imported runtime. Read the
item guidance, copy its HTML and CSS, preserve semantics, and adapt it under
the consumer's ownership. Rename `kin-pattern-` classes to the consumer's
prefix once product-specific decisions enter. See
[`../registry/README.md`](../registry/README.md).

## Moving from 0.1 to 0.2

The `0.2.0` release consolidated patterns proven independently by Kinra Site
and Depot:

- `.kin-canvas` replaced the grid and ambient glows with one quiet top wash;
- `.kin-frame` took ownership of the repeated 82rem measure and responsive
  page gutter;
- `.kin-surface` became square, flat, and rule-bound by default, while
  `.kin-surface--raised` opted into radius and shadow;
- `.kin-prose` adopted flatter editorial treatment for quotations, code,
  tables, and rules; and
- buttons stopped lifting decoratively on hover.

When upgrading, remove local canvas and frame copies only after visual review.
Add `.kin-surface--raised` wherever the old elevation carries real meaning.

## Testing unreleased expansion

The composition, component, recipe, and registry layers on `main` are not part
of `v0.2.0`. Test them only through a full immutable commit SHA. Their eventual
release version and consumer upgrades remain separate maintainer decisions.

## Update a consumer

1. Read the design release and rendered reference catalog.
2. Change the exact tag or test commit in the consumer's dependency record.
3. Run the consumer's native install or vendoring process.
4. Build and visually verify desktop and mobile widths, keyboard focus,
   reduced motion, and the consumer's own high-value workflows.
5. Commit and deploy from the consumer repository on its own schedule.

There is no automatic fleet-wide rollout. Releases may coexist across
consumers for as long as each product needs.

## Current adoption map

- **Kinra Site** pins the exact pre-`0.2.0` commit `2089818`, imports the full
  foundation once, and owns its routes, editorial composition, documentation
  shell, curriculum rendering, and deployment.
- **Depot** vendors `v0.1.0` so its self-contained Go binary acquires no
  runtime dependency. Its `depot-` layer owns forge-specific views and
  interaction.
- **Kinra OS** pins the same pre-`0.2.0` commit for roles and primitives while
  retaining an immersive application shell.

No consumer has adopted `v0.2.0` or the unreleased expansion yet. Each upgrade
belongs to the consuming repository's own change process.
