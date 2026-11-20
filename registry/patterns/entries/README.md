# Entries

Status: **candidate** since 2026-11-20. Evidence: Kinra Observatory at
`cd38936`, in `frontend/src/lib/motion/`: the entry classes and waiting hold
in `motion.css`, `inview.ts` and `frames.ts`, which every instrument there
uses. It requires a second consumer before promotion.

An entry is how an instrument's parts arrive the first time it is seen: its
trace draws, what belongs to the trace fades in with it, and its marks and
words appear in turn. The terms are draw, appear and stagger from
[`motion.md`](../../../docs/motion.md); this pattern plays them once, from
their start, in the frame the instrument is first seen.

Import `@kinra/web/styles/tokens.css`, which holds the terms and the shared
`kin-draw`, `kin-fade` and `kin-appear` keyframes. Copy `entries.css` and the
optional `entries.js` module; TypeScript consumers can copy `entries.d.ts`
too. The module has no dependencies, automatic initialization, global
mutation or network use, and does nothing on import.

| Class                      | For                                                           | Term   |
| -------------------------- | ------------------------------------------------------------- | ------ |
| `kin-pattern-entry-draw`   | A trace, drawn from its start; give the path `pathLength="1"` | draw   |
| `kin-pattern-entry-fade`   | A band, an area or a cloud of marks arriving with its trace   | draw   |
| `kin-pattern-entry-appear` | A mark or a word arriving on its own                          | appear |

`--kin-pattern-entry-i` is a member's place in its group: set it on each
member, or on the group, since it inherits. Each member waits its index times
`--kin-duration-stagger`. `--kin-pattern-entry-after` waits for an earlier
part, written in terms and never in milliseconds:
`calc(var(--kin-duration-draw) / 2)` waits for a trace to be half drawn, and
is 0 wherever draw is.

```js
import { inview } from "./entries.js";

// Once the instrument is in the document. The cleanup releases it.
const release = inview(figure);
```

## Expressive subtrees only

Entries belong inside `data-kin-motion="expressive"`. In the productive
register content is simply there: no trace draws and no group arrives in
turn, so productive content takes none of these classes.

## Only decoration waits

`inview(element)` marks an instrument below the fold `data-inview="waiting"`,
which holds every animation inside it, and releases it in the scroll event
that brings it into view. Scroll events arrive before that frame is painted,
so each entry starts from its beginning in the first frame the instrument is
seen, never part-way through and never after a glimpse of it finished. An
`IntersectionObserver` releases what layout brings into view without a
scroll. An instrument already on screen is left alone and plays at once.

Until then the instrument is whole, since every entry runs from a hidden state
to the element's own style: what waits is how it arrives, never what it says.
Values never wait. A value stands at its reading before it is seen, in print,
in a full-page picture and to a reader who never scrolls that far, and a mark
that carries one stands at it until its entry plays. A new reading after that
is settle, which never waits to be seen.

Never write `data-inview` in markup, so that without the module nothing
waits. The hold stops every animation inside the instrument, so code there
that waits for an `animationend` waits until the instrument is seen. Only the
first sight plays: keep the same path as data arrives, since a new element is
a new entry.

An entry made in script waits with `firstSight(element, run)` and reads its
term with `motion("appear", element)` from `@kinra/web/motion`, so it takes
the register where it stands.

## Less motion

With less motion an entry does not happen at all. The classes take no
animation, `inview` holds nothing, and the instrument is whole wherever it is.

## Frame loops

`frames(element, frame, { maxDt, running })` calls `frame(now, dt)` on each
animation frame only while the element is on screen and its tab is shown.
`dt` is the seconds since the frame before: 0 on the first frame after a
start, and at most `maxDt` (0.1 by default), so a loop that resumes does not
jump. `running(on)` hears each start and stop; Observatory exposes it as
`data-running` for its off-screen test.

Keep frame loops for what CSS cannot run. Motion locked to a clock is one
compositor animation whose start time is set from that clock, not a redraw
each frame. With less motion a live reading steps and a loop shows its still
form; the product's frame function makes that choice.

Draw suits a few traces, not hundreds: it repaints every frame. A dashed trace
already uses its dasharray, so it takes the fade instead. A path with
`pathLength="1"` must not take `vector-effect: non-scaling-stroke`, which
measures the dash on screen and leaves a gap in a fully drawn trace.

Rename the copied classes and properties when product-specific choices enter.
