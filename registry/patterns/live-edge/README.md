# Live edge

Status: **candidate**. Evidence: Kinra Space's Live sessions at `8589b8a`, in
`src/lib/LiveEdge.svelte` and `src/styles/live-edge.css`. It follows both
leading corners of a row, carrying the state in light while the adjacent
caption names it in words. A second consumer is required before promotion.

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
cap the visible count at three. These names reflect the proving consumer.
Adapt them to your own state contract when copying.

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
