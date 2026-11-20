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

## The application

`Shell` is the [application shell](catalog.md#application-shell-shellcss)
with the behaviour the catalog lists under "Behaviour each product writes":
the breakpoint and its first-paint guard, the fold and its chord, focus
handed out of whatever a change hides, `inert`, Escape after the top layer,
tips put away, links that close the drawer, the hairline and the scroller.
The product fills its snippets (`home`, `pages`, `marks`, `column`, `foot`,
`crumbs`, `end`, or a whole `bar`) and keeps the fold wherever it keeps
preferences.

```svelte
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import house from "@phosphor-icons/core/regular/house.svg?raw";
  import { Icon, Shell, ShellItem } from "@kinra/web/svelte";

  let { children } = $props();
  let shell = $state<ReturnType<typeof Shell>>();
  let folded = $state(preferences.folded);
  afterNavigate(() => shell?.navigated());
</script>

<Shell
  bind:this={shell}
  bind:folded
  breakpoint="(max-width: 48rem)"
  path={page.url.pathname}
  onfold={(value) => save({ folded: value })}
>
  {#snippet pages()}
    <ul>
      <li>
        <ShellItem href="/" label="Home" current={page.url.pathname === "/"}>
          <Icon svg={house} />
        </ShellItem>
      </li>
    </ul>
  {/snippet}
  {@render children()}
</Shell>
```

- **The breakpoint is the product's.** `breakpoint` is a media query; the
  shell reads it once mounted and on every change, and writes the matching
  first-paint guard into the document's head, so the stylesheet and the
  script can no longer disagree. Bind `narrow` to read the layout.
- **Navigation.** A link followed in the drawer closes it and gives focus to
  the page. A rail button that routes takes `navigates`. Pass the location as
  `path` so a new page measures the hairline again; in SvelteKit also call
  `navigated()` from `afterNavigate`, since the router moves focus after the page
  has changed. A plain Svelte product with its own router passes its route as
  `path` and needs nothing more.
- **The chord.** The shell answers ⌘B on a Mac and Ctrl+B elsewhere. A
  product with a command palette that owns its keys sets `chord={false}` and
  calls `toggle()` itself.
- **What it holds can move it.** A part of the shell reads `shellState()` for
  `narrow`, `folded` and `open`, and calls `fold()`, `drawer()`, `toggle()` or
  `navigated()`. The component exposes the same moves on `bind:this`.
  `settle()`, its name in 0.8, still works and is deprecated: motion owns
  the word ([`motion.md`](motion.md#settle)).
- **A scroller of the product's own.** When the page scrolls in an element
  inside the page, such as a pane, pass `scroller` so the hairline measures
  it.

`ShellItem` is a rail item: its glyph, a count (`badge`) or state (`status`)
on the glyph's corner, its name said as `label` and `says` together, its label
in a labelled drawer, and its tip. Put each in an `li`.

`Page`, `PageHead`, `Section` and `SectionHead` write
[page anatomy](catalog.md#page-anatomy-pagecss). A `Section` labels itself by
its head. `PageHead` defaults to an `h1`, `SectionHead` to an `h2`; pass
`level` where the outline needs another, such as an `h3` in a dialog. Bind
`heading` to move focus to it, for example after the thing focus was on is
removed.

## Collections

- `List` and `Row`: a row with `href` or `onopen` has a main control and a
  trail beside it, both lighting the whole row
  ([rows that act](composing.md#rows-that-act)). It takes one or the other,
  never both; without either, the row only reads. `current` marks the open row; `tone` draws its still state; `after`
  holds what it opens.
- `Card`: with `href` or `onopen` its title opens it and the whole card
  answers the pointer, while actions in its body and footer stay above.
- `Empty`: with a title the full shape; without one a sentence, which inside a
  list takes `as="li"`.
- `Loading` shows its shape only after `delay` (200ms), so a quick read never
  flashes, and says its `label` meanwhile. `Skeleton` is one placeholder.

## Overlays and messages

- `Dialog` opens with `bind:open`. It takes first focus to `initialFocus`,
  else the first control in its body, else its title, never the close button;
  it gives focus back to whatever held it, unless that has gone or stands
  behind something inert, including when it is removed while open, which
  also calls `onclose`. Escape, the close button and, with `light`, the
  backdrop ask `canClose` first, every time, and nothing closes while
  `busy`; while busy its title holds focus and gives it back after. With
  `onsubmit` its body is a form whose fields wait while `busy`; the footer
  snippet receives `{ form, close }`.
- `Drawer` is a dialog from an edge (`side`), closed by its backdrop.
- `confirm({ title, body, items, action, tone })` resolves `true` or `false`.
  Mount one `ConfirmHost`. It is an alert dialog described by its body; focus
  starts on the way back, Escape answers no, and a new request answers the
  one before it no and moves focus back to the way back.
- `toast({ title, body, tone, action, duration })` raises a toast; mount one
  `Toaster` outside the shell. The region stays in the page as a polite live
  region, so each arrival is read. A toast's time stops while the reader
  points at it or focuses it, each on its own; an error stays until
  dismissed; and a dismissed toast hands focus to the next, or back to where
  it came from. On the server `toast()` raises nothing and `confirm()`
  answers no at once, since a server's module state is shared by every
  request it serves.
- `Notice` stays in the page. Pass `role="status"` or `role="alert"` when it
  arrives after the page has loaded.

## Menus and tips

- `Menu` is a trigger and the `.kin-menu` it opens: an `IconButton` named by
  the required `label`, or the product's own button from the `trigger`
  snippet, which receives the attributes to spread on it. Items are commands
  (`onselect`, which may return a promise), links (`href`, `external`,
  `download`), checkboxes (`checked`), radios in a group (`role:
"menuitemradio"`), separators and labelled groups. An item can be
  unavailable and say why (`disabled: "Only the owner can delete it"`), carry
  a `shortcut`, or confirm itself with `done` words before the menu closes.
  The keyboard is the platform's menu: arrows that wrap, Home and End,
  typeahead, Escape back to the trigger, Tab out. ArrowDown and ArrowUp on the
  trigger open on the first and last item.
- `ContextMenu` is the same menu opened from script:
  `menu.show(event, items)` opens at the pointer for a right-click or a
  Ctrl+click on a Mac, or beneath an element, and returns focus to it on
  closing. Render it inside any dialog or drawer it opens from: a modal
  makes everything outside it inert, a menu included, and the menu warns in
  the console when that happens.
- A menu's popover renders beside its trigger, so keep a `Menu` out of a
  `<p>`; the parser would end the paragraph at it.
- `place()` puts a popover beside an anchor or at a point, inside the viewport
  and its safe areas, flipping when it would cross an edge and right to left
  aware; `follow()` keeps it there while the page scrolls. Use them for a
  product's own popovers.
- `{@attach tip("Undo", "Your last change")}` shows one shared `.kin-tooltip`
  after the pointer rests, or at once for the keyboard, and gives the words to
  the control as its description. The control keeps its own name; the tip
  only describes. `told()` is for a mark that is no control and whose words
  appear nowhere else: it also takes focus. New words for the same control,
  such as Copy becoming Copied, change the showing tip in place. A product's
  own `aria-describedby` keeps the tip's words beside its own, and Escape
  puts a showing tip away before it closes the dialog the tip is in.

## Forms

`Field` names one control and wires its hint and error: the control gets the
field's `id`, `aria-describedby`, `aria-invalid` while there is an error, and
`required`. `Input`, `Select` and `Textarea` take these on their own inside a
field; any other control takes them from the snippet's argument, or reads
`fieldControl()`. The field names its control, so its label always reaches
it: give an id to the field as `for`, not to the control. `Check`, `Radio`, `Switch` and `Segmented` wrap native
inputs, so the keyboard and forms behave as the platform does.

## Icons

`Icon` sizes a product's own glyph to 16, 20 or 24 pixels (`size`), hides it
from assistive technology, and with `along` mirrors one that points along the
line. The products keep their own icon sets; Design does not ship one.

## What the layer is checked against

- `svelte-check` with strict settings types every component.
- The contract check holds the conventions: every component exported and
  typed, no `<style>`, no class outside `kin-`, no import beyond Svelte, and a
  hand-written declaration beside every helper, so a product's TypeScript
  settings never meet the layer's source.
- `tests/types/props.ts` holds the prop rules the types enforce, such as a
  row that cannot both link and open in place, and handlers typed for either
  element.
- The confirm and toast stores are compiled as a consumer's build compiles
  them, for the server and the browser, and tested in Node.
- The catalog renders every component on the server and hydrates it, and the
  browser tests in Chromium and WebKit drive them there: `/svelte/controls/`,
  `/svelte/menus/`, `/svelte/cases/` (the hard cases: guards, busy forms,
  removal while open, replaced confirmations, toasts that hold focus) and
  `/svelte/shell/`, a whole application built from the layer alone.
- A packed copy installed into a plain Vite and Svelte consumer, under
  `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, type-checks
  and builds for the server and the browser.
