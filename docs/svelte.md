# Svelte layer

`@kinra/web/svelte` is an optional set of Svelte 5 components that render the
catalog's markup and carry the behaviour the catalog otherwise asks each
product to write. Kinra Space, Kinra Relay, Kinra Thread and Kinra Home all
build on Svelte 5, and each had written its own page heads, rows, dialogs,
menus, tips and shell wiring; the layer holds one copy of each.

The CSS stays the contract. A component adds no styles of its own: it writes
the classes and attributes [`catalog.md`](catalog.md) documents, so a page
built with the layer and a page written by hand look the same, and a product
that does not use Svelte loses nothing.

## Install and import

The package already installs from its exact Git tag. Svelte is an optional
peer (`^5.57.0`); a product that imports the layer has it already.

```svelte
<script lang="ts">
  import "@kinra/web/styles";
  import { PageHead, Button } from "@kinra/web/svelte";
</script>

<PageHead title="Items" description="Everything the shop keeps in stock.">
  {#snippet actions()}<Button variant="primary">New item</Button>{/snippet}
</PageHead>
```

Import the styles once, where the product imports its own. The layer never
imports CSS, so the product keeps the order of its cascade layers.

The package ships the components as `.svelte` source, with TypeScript that
Svelte 5 reads without a preprocessor, and nothing is built at install.
`vite-plugin-svelte` sees the `svelte` export condition and compiles them
with the product's own code, for the server and the browser. `svelte-check`
reads their types from the source.

## Conventions

These hold for every component, so a product can guess one from another.

- **Markup is the catalog's.** A component renders the documented classes
  and parts, in the documented order, and nothing else. It has no `<style>`
  block and invents no class outside `kin-`.
- **Attributes pass through.** Everything a component does not name is spread
  onto its root element, so `id`, `aria-*`, `data-*`, event handlers and
  attachments work. `class` is merged with the component's own.
- **Options are props named for their attribute.** `data-tone` is `tone`,
  `data-density` is `density`, `data-size` is `size`, `data-variant` is
  `variant`. Each is typed with the values the catalog lists. A boolean
  attribute such as `data-width="full"` is a boolean prop (`full`).
- **Parts are snippets.** The main content is `children`; named parts are
  named snippets (`actions`, `description`, `lead`, `trail`, `footer`). A
  part that is usually words also takes a string (`title`, `summary`, `hint`).
- **Values bind.** What the reader changes is `$bindable`: `value`,
  `checked`, `open`, `pressed`, `folded`. A matching callback (`onchange`,
  `onclose`) reports it when the product needs the moment as well.
- **Names are required.** An icon-only control, a menu, a group of radios and
  a dialog cannot be created without the words assistive technology says.
- **Headings keep the outline.** A component that names a region takes a
  `level` and defaults to its usual place: a page head `h1`, a section head
  `h2`, a card title `h3`.
- **Buttons do not submit by accident.** A `<button>` defaults to
  `type="button"`.
- **Ids are stable.** Generated ids come from `$props.id()`, so they match
  between the server and the browser.
- **It renders on the server.** Nothing touches `window` or `document` until
  the component is mounted, and every state renders from its markup and the
  CSS before the script runs.
- **Motion stays in the CSS.** Components set the attributes the stylesheet
  animates (`data-leaving`, `data-resizing`) and wait for its events; reduced
  motion is the stylesheet's to honour.
- **Copy can change.** Words a component writes itself, such as Close,
  Required or Collapse sidebar, are props with English defaults.

Product state, routes, data, copy and analytics stay with the product. A
component that would need to know them takes a snippet or a callback instead.
