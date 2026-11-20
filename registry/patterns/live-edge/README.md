# Live edge

Status: **stable** since 2026-11-20. Evidence: Kinra Space's Live sessions at
`8589b8a`, in `src/lib/LiveEdge.svelte` and `src/styles/live-edge.css`, and
Kinra Relay's readings in flight since its `f7905ffc` (2026-11-05), in
`src/lib/styles/edge.css`. It follows both leading corners of a row, carrying
the state in light while the adjacent caption names it in words.

That shape is kept for work in flight. A still state never runs along an
edge: its tone is a bar set in from the start, as a notice draws it with
`--kin-tone-bar-width` ([catalog](../../../docs/catalog.md#foundations)). A
notice about work still running carries this edge instead of its bar.

Import `@kinra/web/styles/tokens.css` and, for the example row, `data.css`.
Copy the HTML and CSS. Set the container to `position: relative` and
`--kin-pattern-edge-radius` to its radius; the default is the row radius.
The edge is decorative (`aria-hidden="true"`). A visible caption must name
every state; colour and movement never replace it.

| `data-edge`    | Meaning                          | Form                         |
| -------------- | -------------------------------- | ---------------------------- |
| `ready`        | No work or unacknowledged result | No light                     |
| `working`      | Foreground work                  | A sweeping band              |
| `agents`       | Background work remains          | Drifting sparks              |
| `waiting`      | The next move is the person's    | Amber line                   |
| `closing`      | Foreground work ended            | Light gathers and clears     |
| `finished`     | Work ended out of view           | Held line until acknowledged |
| `elsewhere`    | Another client owns the work     | Still dotted line            |
| `reconnecting` | Connection is returning          | Dashed amber line            |

`data-sparks="1|2|3"` carries background work beside the foreground band;
cap the visible count at three. A product may use a subset: Relay draws
`ready`, `working` and `closing`, and Space all eight. The states, their forms
and the `kin-pattern-live-edge` parts are now under the compatibility policy,
so renaming or removing one here is a breaking change. A product's own copy
may still rename its classes and map the states to its own contract.

The consumer owns the lifecycle. When `working` ends into `ready`, `agents`,
or `elsewhere`, show `closing` for 1100ms, then the destination state. If an
answer is needed, the connection goes away, or a result must be acknowledged,
show that state immediately. Cancel a pending close whenever new work or a
new state supersedes it, and cancel timers when the row is removed.
With reduced motion, clear the edge immediately instead of waiting for the
gather. CSS independently stops every loop and retains a different static
form for foreground and background work. Forced colours preserve those forms
in Highlight.

Settled states never loop. Rename the copied classes and properties when
product-specific decisions enter; no session or network logic belongs here.

## Compatibility review

Before the promotion on 2026-11-20, both consumers' copies were compared with
this source declaration by declaration.

- Relay's `src/lib/styles/edge.css` at `6d804088` matches it once its
  `relay-edge` classes and `--relay-edge-*` properties map back. It adds
  `data-traced`, a short trace down a row a change just touched, which stays
  Relay's.
- Space's `src/styles/live-edge.css` at `db1eeae3` keeps the same parts,
  states and timings. Since the candidate was taken it has added a faint
  `data-track` line in settled states, shared the edge's geometry with other
  Space surfaces, and named its wash amounts; those stay Space's.

Neither addition is promoted: each has one consumer.
