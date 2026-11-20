# Composing with range

This guide is for anyone assembling a Kinra surface, including AI peers
working inside a consumer repository. The system has enough range that no two
products need to look alike; the failure mode is reaching for the same few
elements every time. Read [`catalog.md`](catalog.md) for the full contract.

The reference catalog's `/examples/` page demonstrates a collection, reading
preferences, and a review panel with working interactions. Their local
composition and option-card experiment are examples, not package exports or
registry patterns; consumer evidence is still required before promotion.

## Choose the axes first

Before placing a component, decide three things for the page or region:

1. **Ground.** `data-kin-scheme="dark"` for operating surfaces and tools,
   `light` for reading and authored work, `auto` when the reader should
   decide. A bounded subtree may differ from its page: a paper card on a
   graphite dashboard, or a graphite console inside a paper document.
2. **Job.** `data-kin-surface` sets measure and density: `editorial`,
   `documentation`, `learning`, `operations`, or `application`.
3. **Voice.** The application recipe selects sans UI, headings and display;
   code remains mono. Other recipes retain their own defaults. `data-kin-voice`
   changes heading and display roles only, never UI: serif for essays and
   releases, mono for consoles and references. To keep an entire application's
   UI and headings mono, use the explicit role override in
   [adoption](adoption.md#moving-to-06-application-typography).

Two products that share all three choices should still differ in composition
and content. Two products that differ in even one look related without looking
identical.

## Open at reading scale

The ordinary page opening is a `.kin-title` and one descriptive sentence, with
space rather than a rule before the work. It is not an eyebrow, a display
statement, a lede beside it, and two
buttons; that formula is what every generated landing page uses, and it makes
unlike products look alike. `.kin-display` is for one statement per product,
on the page that states its position, and even there it stays at reading
scale. Alternatives that stay in the identity:

- A `.kin-cover` with a single `.kin-title` and one action.
- A `.kin-bar` title row followed directly by a `.kin-toolbar` and data.
- A `.kin-split` with a `.kin-headline` beside a `.kin-kv` fact list.
- A `.kin-center` narrow column with a `.kin-lede` and no heading ornament.
- A breadcrumb, a `.kin-heading`, and the work itself.

Use the eyebrow when a kicker adds information, not as a ritual above every
heading.

## Compose an application

An application whose pages stand beside its work uses the shared
[application shell](catalog.md#application-shell-shellcss): a rail of its pages
beside a column of its work, and the page on one raised panel. Use it rather
than building a sidebar; `/shell/` shows its states. A product with a few pages
and no standing work can keep top navigation, as the `/applications/`
collection does.

- Put in the rail only what means the same thing on every page: the K, the
  primary pages, and at its foot the scheme and the account. Tools that act on
  what is in view belong in the bar.
- The column holds the product's standing work: what is alive, open or kept
  close. It is not a second copy of the rail.
- The folded rail keeps a few marks for what the column held, with their
  lights. It never scrolls, so show as many as fit.
- Write the [behaviour](catalog.md#behaviour-each-product-writes) where the
  product's state lives, and keep its fold wherever it keeps preferences.

Inside the panel, start from existing type roles, stacks, clusters and
controls. The `/applications/` reference page puts the same page and section
heads into both a top-navigation collection and a navigation region beside a
work surface:

- A page head names the work, optionally adds a quiet summary, places its action
  group at the end and puts one description on the next line.
- A section head uses a smaller heading, an optional count and compact actions,
  with the description beneath. Let wrapping follow available room and keep
  DOM reading order; do not require a particular sidebar width.
- A collection keeps search, filters, results and an inspector together. Loading,
  empty and failed reads are different states; the example lets you inspect
  each without a service.
- Bind nested surfaces to their actual page tone. The shell's panel binds
  `--kin-surface-nested` to its own; a work surface of the product's does the
  same. Keep the content inset even when a product's media intentionally
  reaches the edge.

The page and section heads are `.kin-page-head` and `.kin-section-head`
(`page.css`), shared once Kinra Space and Kinra Relay had each built both;
`.kin-page` holds the page at one inset and measure, and `.kin-section` spaces
open sections. A Svelte product writes them with `Page`, `PageHead`, `Section`
and `SectionHead` from the [Svelte layer](svelte.md), and the shell with
`Shell`. What fills the shell stays local: routes, the column's contents,
scroll restoration, saved state, action placement policy, gestures, safe-area
readings beyond the shell's own and native-host behavior. A second product
that looks similar is not evidence for promoting a registry candidate unless
it proves the same responsibility; the shell was shared once three products
had built the same one.

## Space by role

Spacing roles name the scale's steps by their job, so two products that space
the same thing choose the same step. Use the role, not the step it resolves
to, and override a role for a product or a region rather than copying its
value.

| Role                   | Step    | Job                                                                                  |
| ---------------------- | ------- | ------------------------------------------------------------------------------------ |
| `--kin-gap-tight`      | 4px     | a title to its line, a label to its value                                            |
| `--kin-gap-inline`     | 8px     | side by side: an icon and its words, a group's buttons                               |
| `--kin-gap-stack`      | 12px    | parts stacked inside one surface                                                     |
| `--kin-gap-surface`    | 16px    | bounded surfaces beside each other, such as cards                                    |
| `--kin-gap-head`       | 16px    | a section head to what it heads                                                      |
| `--kin-gap-section`    | 40px    | open sections, with no surface between them                                          |
| `--kin-row-pad-block`  | 8px     | a row's inset above and below; 4px in a compact list                                 |
| `--kin-row-pad-inline` | 12px    | a row's inset at its ends; 16px in a bounded list                                    |
| `--kin-surface-pad`    | 20px    | a card's or notice's inset; a compact card takes 16px                                |
| `--kin-page-inset`     | 16–24px | the page's inset in the panel, by the window's width, up to `--kin-page-max` (80rem) |

- **Every length is on the scale.** Padding, margins, gaps, insets and radii
  take the scale's steps, through a role or `--kin-space-*`. Only the 1px and
  2px hairlines sit under it. A value between two steps rounds: a repeated row
  keeps its density and takes the smaller, a card may take the larger.
- **A deliberate exception says why**, in a comment beginning `off-scale:` on
  its line or the line before. Design's own optical values, such as a line
  centred on a marker, carry one.
- **Check it.** `kinra-check-spacing`, which the package installs, reads the
  scale from Design's tokens and fails on a length off it, on an unknown
  `--kin-*` name, and on an exception without a reason. Run it from the
  product's own check: `npx kinra-check-spacing src`, with `--strict` to admit
  only roles and steps, not raw lengths that happen to be on the scale.
- **Corners nest.** A rounded surface inside another is flat, or rounds at the
  outer radius less the padding between them: panel, then layer, then row.
- **A rounded fill never meets a line.** In a list with rules
  (`.kin-list[data-rules]`) a lit row fills edge to edge and square; a list of
  rounded rows has no rules.

## Rows that act

A row opens, and its trail acts on it. Give the row a main control,
`.kin-list__main` on its link or button (`Row` with `href` or `onopen`), and
put its actions in `.kin-list__trail` beside it, never inside it: each is its
own tab stop. Pointing at or focusing either lights the whole row. What the
row opens goes in `.kin-list__after`, beneath it and inside its light. A row's
still state is the tone bar (`data-tone`); the open row is a tint
(`aria-current` on its main control), never an edge. A trail that should keep
quiet until wanted takes `data-trail="reveal"` on the list: it keeps its
room, so the name never moves, and shows on touch.

## Write titles as descriptions

A title names the thing: "Foundations", "Recent jobs", "Install the package".
It is not an aphorism about the thing. Two-clause mottos ("Structure first.
Signal second.") and "X, one Y" constructions read as generated even when a
person wrote them. Put the idea in the first sentence of the body instead.

## Pick the element for the job

| Need                                               | Use              | Not                   |
| -------------------------------------------------- | ---------------- | --------------------- |
| Non-interactive category or state label            | `.kin-badge`     | a button or a chip    |
| Filter, selection, or removable value              | `.kin-chip`      | a badge               |
| A word plus a live or settled state                | `.kin-status`    | a coloured badge      |
| A short in-page message that persists              | `.kin-notice`    | a toast               |
| A brief message about something that just happened | `.kin-toast`     | a notice              |
| A decision that blocks the page                    | `.kin-dialog`    | a notice with buttons |
| Inspecting one item beside the work                | `.kin-drawer`    | a modal dialog        |
| Rows of peers with a title and metadata            | `.kin-list`      | a table or cards      |
| Comparable values across columns                   | `.kin-table`     | a list                |
| Bounded items with actions in a grid               | `.kin-card`      | raised surfaces       |
| Facts about one thing                              | `.kin-kv`        | a two-column table    |
| A measured number with a label                     | `.kin-figure`    | a large heading       |
| What happened, in order                            | `.kin-log`       | a list of cards       |
| A real multi-step sequence                         | `.kin-steps`     | numbered headings     |
| One choice among a few peers                       | `.kin-segmented` | several buttons       |
| An on or off setting                               | `.kin-switch`    | a checkbox in a form  |
| Peer views of one thing                            | `.kin-tabs`      | a nav rail            |
| Sections of a document or app                      | `.kin-nav`       | tabs                  |
| An application's pages beside its standing work    | `.kin-shell`     | a hand-built sidebar  |

## Put the one action in the corner

When a surface exists to take or confirm one action (a composer, a question,
a dialog's confirmation, a search, a card built around one action), that
action sits flush in the surface's end corner, following
[the principles](principles.md#the-corner). Its way back, such as Cancel,
takes the start corner, quiet; a footer with nothing to confirm ends in its
close, quiet. Asides and alternatives stand between the corners as ordinary
buttons, beside the confirmation. A surface with several equal actions keeps
them together in a row instead. Copy the candidate
[corner action](../registry/patterns/corner-action/README.md) for a labelled
confirmation, or [corner key](../registry/patterns/corner-key/README.md) for
an action whose icon changes meaning. They are source to own, pending a
second consumer; the [refresh plan](refresh-plan.md) records their evidence.

Keep one primary fill available to the screen's one action. Shared cards,
notices, surfaces, and disclosures render their primary buttons in the tint;
a modal retains its fill while the page beneath it is inert. The product
still chooses which action is primary and whether a context calls for a
corner. Do not infer a corner confirmation from the last button in any row.

## Compose with the mark, not with colour

Signal colour is reserved for state. When a region needs emphasis without
state, use structure: a step in tone such as a `.kin-surface--sunken` well or
a raised layer, space, or a change of measure. Keep rules for content read
across or down: a `.kin-rule` ledger with its tick, or a hairline
`.kin-grid[data-rules]` of comparable cells, `data-rules="between"` where the
cells stand in a page with no frame of their own. Add `data-tone` to a surface or
card only when the tone reports a real state of that item.

Pick the shape by what the state is doing. A still block in a tone, such as
a row that changed or waits, takes the bar a notice draws:
`--kin-tone-bar-width`, set `--kin-space-1` in from its start and
`--kin-space-2` from its top and bottom, never a stripe that bends round a
rounded corner. A selected tile takes a ring. Only work in flight runs along
the edge, with the [live edge](../registry/patterns/live-edge/README.md).

## Keep numbers honest

Steps carry their index in the document. Figures, tables, key-value lists,
and logs keep tabular figures. Do not number sections for rhythm; use
`.kin-rule--labeled` or a `.kin-label` instead.

## Let motion mean something

Render `.kin-spinner`, an indeterminate `.kin-progress`, a `.kin-skeleton`, or
a `data-live` log entry only while work is in flight, and remove them when it
stops. Layers arrive from where they live and leave with a fade: toasts,
dialogs, drawers, and panels. A control that changes meaning folds into its
new shape in one movement. Nothing else moves.

## Before handing off

- Both schemes render legibly, including any subtree that changes scheme.
- Keyboard focus is visible on every control.
- Reduced motion leaves the meaning intact.
- Every icon-only button has a label.
- The page does not scroll horizontally at 400px wide.
