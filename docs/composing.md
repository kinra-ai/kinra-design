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
3. **Voice.** The recipe picks a display voice; `data-kin-voice` overrides it
   for a region. Serif for essays and releases, mono for consoles and
   references, sans for dense application chrome.

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

## Put the one action in the corner

When a surface exists to take or confirm one action (a composer, a question,
a dialog's confirmation, a search, a card built around one action), that
action sits flush in the surface's end corner, following
[the principles](principles.md#the-corner). A surface with several equal
actions keeps them together in a row instead. The package has no class for
the corner action yet; the [refresh plan](refresh-plan.md) tracks one.

## Compose with the mark, not with colour

Signal colour is reserved for state. When a region needs emphasis without
state, use structure: a step in tone such as a `.kin-surface--sunken` well or
a raised layer, space, or a change of measure. Keep rules for content read
across or down: a `.kin-rule` ledger with its tick, or a hairline
`.kin-grid[data-rules]` of comparable cells. Add `data-tone` to a surface or
card only when the tone reports a real state of that item.

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
