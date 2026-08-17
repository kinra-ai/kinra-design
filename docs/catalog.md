# Public design catalog

The package separates durable responsibilities from copy-owned composition.
Every public custom property and class uses the `kin-` namespace. All CSS
entry points are framework-independent and safe to bundle at build time.

The rendered reference catalog demonstrates the current contract:

```bash
npm run dev
```

## Entry points

| Entry point                          | Provides                                     |
| ------------------------------------ | -------------------------------------------- |
| `@kinra/web/styles`                  | complete opinionated system                  |
| `@kinra/web/styles/tokens.css`       | custom properties only                       |
| `@kinra/web/styles/base.css`         | tokens, reset, and global defaults           |
| `@kinra/web/styles/canvas.css`       | quiet canvas, frame, and original primitives |
| `@kinra/web/styles/compositions.css` | opt-in layout relationships                  |
| `@kinra/web/styles/components.css`   | generic controls and states                  |
| `@kinra/web/styles/recipes.css`      | opt-in surface role adjustments              |
| `@kinra/web/styles/prose.css`        | scoped long-form typography                  |
| `@kinra/web/registry`                | source registry manifest                     |

`canvas.css` retains the original button, status, surface, and eyebrow classes
for compatibility. New generic controls live in `components.css`. The complete
import includes both.

## Foundations

Tokens cover semantic colour, typography roles, a twelve-step spacing scale,
causal motion, shape and depth, controls, reading measures, shell measures, and
responsive region spacing. Consumers override roles rather than copying
values:

```css
.product-reader {
  --kin-font-prose: var(--kin-font-mono);
  --kin-measure-prose: 42rem;
}
```

The stable foundational classes are:

- `.kin-canvas` and `.kin-frame`;
- `.kin-surface` and `.kin-surface--raised`;
- `.kin-eyebrow`;
- `.kin-button`, `.kin-button--primary`, and `.kin-button--quiet`;
- `.kin-status` with `data-state="reason|running|success|warning|error"`;
- `.kin-prose`; and
- `.kin-sr-only`.

## Compositions

Compositions establish spatial relationships and collapse without changing
source order.

| Class          | Responsibility                    | Options                                         |
| -------------- | --------------------------------- | ----------------------------------------------- |
| `.kin-region`  | responsive vertical region space  | `--kin-region-space`                            |
| `.kin-stack`   | vertical rhythm                   | `data-space`                                    |
| `.kin-cluster` | wrapping peer row                 | `data-space`, `data-align`, `data-justify`      |
| `.kin-grid`    | auto-fitting fluid grid           | `data-space`, `--kin-grid-min`                  |
| `.kin-split`   | two peer regions                  | `data-space`, `data-ratio`, `data-align`        |
| `.kin-sidebar` | bounded rail plus flexible region | `data-space`, `data-side`, `--kin-sidebar-size` |

`data-space` accepts `tight`, `compact`, or `loose`; omitting it uses the
composition's ordinary default. `data-ratio` accepts `lead` or `trail`.
`data-side="end"` places a sidebar after the work region. Split and sidebar
collapse to one column at `48rem` while preserving DOM order.

## Components

Components expect semantic HTML. Class names do not replace labels, headings,
table scope, descriptions, or native control behavior.

- `.kin-badge` labels taxonomy or bounded state and accepts
  `data-tone="primary|reason|success|warning|error"`.
- `.kin-notice`, `.kin-notice__title`, and `.kin-notice__body` communicate a
  visible message; `data-tone` supplements its words.
- `.kin-field`, `.kin-field__label`, `.kin-field__hint`, and
  `.kin-field__error` organize explicit form relationships.
- `.kin-input`, `.kin-select`, and `.kin-textarea` provide common focus,
  invalid, disabled, and touch-target treatment.
- `.kin-check` wraps a native checkbox or radio and its visible label.
- `.kin-table-wrap` contains horizontal overflow; `.kin-table` retains native
  table semantics and accepts `data-density="compact"`.
- `.kin-empty`, `.kin-empty__title`, and `.kin-empty__body` describe a truly
  empty collection and an earned next action.
- `.kin-disclosure` styles native `details` and `summary`; its content uses
  `.kin-disclosure__body`.

Consumers remain responsible for validation logic, table column priorities,
interactive row controls, asynchronous state, and product-specific behavior.

## Surface recipes

Apply `data-kin-surface` to a document or bounded subtree. A recipe changes
role values only; it does not create a page shell.

| Value           | Bias                                                   |
| --------------- | ------------------------------------------------------ |
| `editorial`     | generous region rhythm and long-form measure           |
| `documentation` | wider shell, denser navigation, readable prose         |
| `operations`    | compact controls and data-dense working measure        |
| `application`   | broad canvas, tighter regions, product-owned workspace |

A consumer may override any recipe role it can own safely. Product-specific
navigation, editors, grids, and immersive canvases remain local.

## Registry patterns

The exported manifest and pattern source live in [`../registry`](../registry).
Candidates include narrative intro, editorial feature, and operations region.
Read [`registry/README.md`](../registry/README.md) before copying one. Registry
classes use `kin-pattern-` only in canonical source; a consumer should rename
them when product-specific behavior or composition enters.

## Compatibility

Adding a class, token, recipe, or registry item is additive. Renaming or
removing a stable class, token, data value, asset, or export is breaking under
the repository's pre-1.0 release rules. Candidate registry source may change
before promotion, and its status makes that instability explicit.
