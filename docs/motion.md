# Motion

Status: draft for 0.9.0. Blake approved the vocabulary and the lab on
2026-11-20. The defaults under [Decisions](#decisions) await his review, and
values may change when he calibrates them on `/motion/calibrate/`.

How everything that moves on a Kinra surface moves, and why. This page is
the motion standard: consumers apply it rather than reinterpreting it, and a
change here is a change to the design system, made once and released.

It governs every Kinra surface that moves, not only the web: a native app, a
television ident and a terminal follow the same terms and the same numbers.
[`principles.md`](principles.md) holds the doctrine;
[`../src/styles/tokens.css`](../src/styles/tokens.css) holds the values, and
the three tables on this page are tested against it. `/motion/` in the
reference catalog plays every term in both registers.

## Read this first

1. Use only the words on this page. A product never coins a motion word, and
   never reuses one for something else. When no term fits, nothing moves, or
   the timing is a [signature](#signatures), or the gap comes to Design.
2. Nothing moves without a cause: the reader, new data, work starting or
   ending, or a place the reader chose. At rest only work in flight and a
   product's declared continuous motion move. Nothing blinks.
3. Durations and curves come from tokens, never from a number written by
   hand.
4. Content is whole without motion. Every arrival runs from a hidden state to
   the element's own style, and a value is never held back.
5. With less motion every term lands at once, and every meaning stays.
6. Controls, layers and work in flight move the same everywhere. Content and
   place take the register: productive, the default, or expressive.

Say motion. Animation is the browser's object, and the word belongs in code.

## Should it move?

1. Is something changing now, because of the reader, new data, work starting
   or ending, or a place the reader chose? If not, nothing moves.
2. What is moving? Find its family below.
3. What kind of change is it? That names the term.
4. If no term fits and the timing belongs to the thing drawn, it is a
   signature. Otherwise it does not move.
5. Use the term's tokens and the mechanics in its [glossary](#glossary)
   entry.
6. Content and place take the register. A component that can sit in either
   register is checked in both.
7. If it loops, it is work in flight or one of the product's declared
   continuous motions. Otherwise it does not loop.
8. Check it with less motion, before it is seen, off screen and in print.

| What moves                                                           | Family         | Terms                            | Register   |
| -------------------------------------------------------------------- | -------------- | -------------------------------- | ---------- |
| A control answering the reader, or something on the page making room | Controls       | control, surface, bloom, morph   | fixed      |
| Something above the page, or a panel of the frame                    | Layers         | layer, popover, exit             | fixed      |
| Information: a value, a trace, words, marks, rows                    | Content        | settle, draw, appear, stagger    | registered |
| The whole view, because the reader moved                             | Place          | navigate                         | registered |
| A loop that exists only while work runs, and its ending              | Work in flight | trace, sweep, pulse, pass, close | fixed      |
| The timing of a real process, or of one pattern's identity           | Signature      | declared where it is defined     | its own    |

| Asked for                        | Answer                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Make it feel alive               | Motion needs a cause. At rest, nothing moves.                                                    |
| Count the number up              | The figure is the value and changes at once. In the expressive register its geometry settles.    |
| Lift the card on hover           | A control answers in tone, not position.                                                         |
| Pulse the badge for attention    | Nothing blinks. Say it in words and steady colour.                                               |
| Redraw the chart on refresh      | A trace draws once, when it is first seen. Later changes settle, or land.                        |
| Stagger the rows in on load      | In the productive register content is simply there.                                              |
| Make it spring                   | No term overshoots its value. An overshoot belongs to a signature, such as an escapement's gait. |
| Dock it once it has played       | Nothing moves that the reader did not ask for.                                                   |
| Fade the toast out slowly        | Every layer exits at one speed.                                                                  |
| Add a spinner beside the shimmer | One piece of work has one trace.                                                                 |

## Rules

Each rule is one sentence a reviewer or a test can check.

1. **Named.** Every motion is a term on this page or a declared signature.
2. **Caused.** Every motion starts from the reader, new data, work starting
   or ending, or a place the reader chose. Nothing moves to look alive, and
   nothing moves that the reader did not ask for.
3. **Budget.** At rest, the only infinite animations are work in flight and
   the product's declared continuous motion. Nothing blinks.
4. **Tokens.** No literal duration, delay or curve appears outside
   `tokens.css` or a signature, and a `--kin-motion-*` pair is never followed
   by another curve.
5. **Whole.** Arrival keyframes are from-only; an exit runs to hidden and the
   element is then removed. With every animation cancelled, the page shows
   its settled state.
6. **Values never wait.** A value stands at its reading before it is seen, in
   print and with less motion. Only decoration waits.
7. **Seen.** An entry starts from its beginning in the first frame its
   element is visible, never part-way through.
8. **One clock.** Motion that shows time takes its start from its source's
   clock. One picture has one clock, and nothing an animation carries is
   placed by a timer.
9. **Off screen.** A frame loop stops while its element is off screen or its
   tab is hidden.
10. **Less motion.** Content and place compute to 0ms and transitions land at
    once; a loop keeps a still form that says the same; live readings step;
    every meaning stays.
11. **Compositor first.** Loops animate only transforms and opacity, or a
    small mark's paint. Layout moves only as a one-off change the reader
    caused.
12. **Interruptible.** A newer change retargets from where things stand, and
    never jumps back to begin again.
13. **One thing moves per cause.** No trail, afterglow or glow follows a
    moving part.

## Families and registers

A register sets how content and place move. **Productive**, the default, is
for work: a value lands at once, data is there when the page is, and a new
page simply arrives. **Expressive** is for surfaces where the movement
carries the meaning: values travel to their reading, traces draw when first
seen, groups arrive in turn and the page moves between places. Controls,
layers and work in flight read no register.

Declare it with `data-kin-motion` on the document or on any bounded subtree,
as a scheme is declared:

```html
<html data-kin-motion="expressive">
  …
  <form data-kin-motion="productive">…a settings form moves as work…</form>
</html>
```

The nearest `data-kin-motion` decides. The product or the page sets it; a
component never sets its own. A product records its choice in its interface
guide.

A product may set a registered term on an element that carries
`data-kin-motion`, inside `@media (prefers-reduced-motion: no-preference)`.
The pairs (`--kin-motion-settle` and the rest) are paired again at every
register boundary, so a duration set anywhere else changes `--kin-duration-*`
but not the pair, and a value set outside that media query would survive less
motion.

Script reads the duration and curve from the element it moves, never from
the root, so a subtree's register holds. `@kinra/web/motion` does it:
`motion("appear", element)` gives the term's milliseconds, its CSS curve for
the Web Animations API and a progress function for a tweening library, and 0ms
for every term with less motion; `period("trace")` gives a loop's period,
never 0, for a still form's timer. Copying the numbers into a product's own
module is how they drifted before.

Without the CSS, a native surface takes the same numbers: each duration in
milliseconds and each curve's four control points. SwiftUI's
`.timingCurve(x1, y1, x2, y2, duration:)` takes them directly.

### Values

"None" is 0ms: the content is simply there. "Kept" means the token keeps its
value with less motion, while `base.css` lands the CSS that uses it at once.

<!-- motion:values -->

| Term     | Family         | Productive | Expressive | Curve         | Less motion |
| -------- | -------------- | ---------- | ---------- | ------------- | ----------- |
| control  | Controls       | 120ms      | 120ms      | standard      | kept        |
| surface  | Controls       | 180ms      | 180ms      | out           | kept        |
| bloom    | Controls       | 260ms      | 260ms      | bloom         | kept        |
| morph    | Controls       | 320ms      | 320ms      | morph         | kept        |
| layer    | Layers         | 320ms      | 320ms      | out           | kept        |
| popover  | Layers         | 180ms      | 180ms      | out           | kept        |
| exit     | Layers         | 180ms      | 180ms      | in            | kept        |
| settle   | Content        | none       | 1400ms     | out           | 0ms         |
| draw     | Content        | none       | 1400ms     | out           | 0ms         |
| appear   | Content        | 180ms      | 360ms      | out           | 0ms         |
| stagger  | Content        | none       | 45ms       | —             | 0ms         |
| navigate | Place          | none       | 460ms      | out           | 0ms         |
| trace    | Work in flight | 1.6s       | 1.6s       | linear        | kept        |
| sweep    | Work in flight | 1.6s       | 1.6s       | standard      | kept        |
| pulse    | Work in flight | 1.8s       | 1.8s       | standard      | kept        |
| pass     | Work in flight | 1.05s      | 1.05s      | steps(1, end) | kept        |
| close    | Work in flight | 300ms      | 300ms      | out           | kept        |

<!-- /motion:values -->

Each term is `--kin-duration-<term>` and, except stagger, which is a step
between members, `--kin-motion-<term>`: the duration and its curve, ready for
`transition` or `animation`.

### Curves

<!-- motion:curves -->

| Curve    | Token                 | Control points  |
| -------- | --------------------- | --------------- |
| out      | `--kin-ease-out`      | 0.16, 1, 0.3, 1 |
| in       | `--kin-ease-in`       | 0.7, 0, 0.84, 0 |
| standard | `--kin-ease-standard` | 0.4, 0, 0.2, 1  |
| bloom    | `--kin-ease-bloom`    | 0.2, 0, 0, 1    |
| morph    | `--kin-ease-morph`    | 0.4, 0, 0, 1    |
| linear   | —                     | 0, 0, 1, 1      |

<!-- /motion:curves -->

A curve says how much of the change is done at each moment of its time.
**Out** has covered half its distance after a tenth of its time, 83% after a
quarter and 95% after 43%: an expressive settle of 1400ms has arrived after
about 350ms and spends the rest landing. **In** has covered 3% at half time
and half only at 90%, so a 180ms exit holds for about 140ms and then goes.
**Standard** covers half by 35% of its time and 95% by 73%. **Bloom** covers
half by 20%, and **morph** by 27%. The curve follows the path: arrivals and
answers use out, departures use in, a change of colour or a loop that
breathes uses standard, and a constant lap uses linear.

### Deprecated

<!-- motion:deprecated -->

| Token                    | Value                      | Use instead                                           |
| ------------------------ | -------------------------- | ----------------------------------------------------- |
| `--kin-duration-retract` | 200ms                      | exit; the corner key keeps 200ms as its own signature |
| `--kin-duration-lift`    | 260ms                      | exit, toward where the thing went                     |
| `--kin-duration-fold`    | 400ms                      | morph; the corner key keeps 400ms through its spine   |
| `--kin-ease-lift`        | cubic-bezier(0.4, 0, 1, 1) | `--kin-ease-in`                                       |

<!-- /motion:deprecated -->

A deprecated token keeps its value for at least one minor release; removing
it is a breaking change with a migration note.

## Glossary

Every entry has the same parts: what the term means, how it moves, what it
becomes with less motion, where it is used, where it is not, and the words it
replaces. Its values are in the [table](#values).

### Controls

#### control

- **Meaning.** A control answers the reader: hover, press, focus, a choice
  made.
- **Mechanics.** Colour, fill, border and opacity change. A part inside the
  control moves by `translate` or `rotate`: a switch's thumb, a disclosure's
  arrow, a caret. Nothing moves outside the control, and the control itself
  stays where it is.
- **Less motion.** It lands at once.
- **Examples.** A button's fill under the pointer; a switch's thumb crossing;
  a disclosure's arrow turning; a selection indicator moving to the chosen
  tab; a tip fading in after its wait.
- **Counterexamples.** The focus ring, which never moves. A card rising under
  the pointer: a control answers in tone, not position. A menu opening:
  popover.
- **Replaces.** `var(--kin-duration-fast) ease` written by hand; "control
  speed".

#### surface

- **Meaning.** Something already on the page adjusts its place, size or depth
  because something else changed.
- **Mechanics.** `translate` (FLIP, for rows that reflow), `box-shadow`, or a
  one-off change of size the reader caused. Never in a loop.
- **Less motion.** At once.
- **Examples.** Rows sliding to make room for a new one; a composer growing a
  line; a bar's shadow as content passes beneath it; a determinate progress
  fill following its work.
- **Counterexamples.** A new row arriving: appear. A gauge moving to a new
  reading: settle.
- **Replaces.** Space's `reflow`; "surface speed".

#### bloom

- **Meaning.** Something becomes possible.
- **Mechanics.** A fill grows from its anchor: `clip-path: inset()` from a
  pinned corner, or `scale` from a `transform-origin` at the anchor. When the
  action stops being possible, the fill goes back into its anchor: exit.
- **Less motion.** Full at once.
- **Examples.** The corner key's fill when there is something to send; the
  live edge's waiting line pouring in from its edge.
- **Counterexamples.** A new row in a list: appear. A button becoming
  enabled: control.
- **Replaces.** Nothing; Relay's `bloom` and Space's `source-bloom`, which
  bring in new content, become appear.

#### morph

- **Meaning.** A control's meaning changes, so its icon changes shape in one
  movement.
- **Mechanics.** The icon's strokes travel, turn the shorter way and resize
  between poses. Never a crossfade between two icons.
- **Less motion.** The new icon at once.
- **Examples.** Send becoming Stop; Play becoming Pause.
- **Counterexamples.** An icon that only changes colour: control.
- **Replaces.** "Fold" as a verb of motion, and `--kin-duration-fold`.

### Layers

#### layer

- **Meaning.** A layer arrives from where it lives: a dialog, a toast, a
  drawer, a sheet, or the shell's sidebar opening.
- **Mechanics.** From-only `opacity` and `translate`: a dialog or a toast
  rises 0.5rem, a drawer comes 1.5rem from its edge, along `--kin-flow`. Its
  backdrop fades in with it on the same term. The sidebar's width moves on
  this term both ways, since it never leaves the screen.
- **Less motion.** There at once, so focus can enter it in the same frame.
- **Examples.** `.kin-dialog`, `.kin-drawer`, `.kin-toast`.
- **Counterexamples.** A menu from its button: popover. The rows inside a
  panel: appear.
- **Replaces.** Space's `rise`, `present` and `arrive-end`;
  `kin-layer-arrive`.

#### popover

- **Meaning.** A layer anchored to the control that opened it arrives from
  that control.
- **Mechanics.** From-only `opacity` and a rise of 0.5rem into its place.
- **Less motion.** At once.
- **Examples.** A menu; a popover; a context menu.
- **Counterexamples.** A tip that names a control: control, since it fades in
  after its wait and never travels. A dialog: layer.
- **Replaces.** Relay's `relay-drop` and `relay-arrive-end`.

#### exit

- **Meaning.** Something leaves: a toast, a menu, a popover, a dialog and its
  backdrop, a drawer, a sheet, a fill going back into its corner.
- **Mechanics.** It goes back the way it came, half the distance and faster:
  a toast that rose 0.5rem falls 0.25rem as it fades. What the reader sent
  leaves toward where it went: the corner key's fill lifts out of the top as
  a message goes up. What arrived at once goes at once. Modality and focus
  move when the exit starts, not when it ends; the element is removed on its
  `animationend`.
- **Less motion.** Gone at once. A kept exit runs for 0.01ms, so its
  `animationend` still fires.
- **Examples.** A toast with `data-leaving`; Space's trays and dialogs, all
  at one speed (Space 0065); Relay's menus, toasts and selection bar.
- **Counterexamples.** Each layer leaving at its own speed. Focus moving only
  when the fade ends. Work ending: close. `animation: none` with less motion
  where code waits for `animationend`: the event never comes.
- **Replaces.** Relay's `settle`; Space's `exit`, `dismiss`, `sink` and
  `riseInPlace`; `kin-toast-leave`; "lift" and "retract".

### Content

#### settle

- **Meaning.** The thing that carries a value moves to the new value: a hand,
  an index, a dot, a level, a zoom.
- **Mechanics.** One transition on the property that carries the value:
  `rotate`, `translate` or `scale`, or `cx`, `r` or `stroke-dasharray` in
  SVG. It starts from wherever the value stands, so a second change turns
  from there. The words that state the value change at once; only the
  geometry travels.
- **Less motion.** It lands at once.
- **Examples.** Expressive: a dial's hands landing on the time, a satellite's
  light settling into each new report (Observatory). Productive: none, so a
  sample lands at once (Space 0122).
- **Counterexamples.** A row arriving in a list: appear. A toast leaving:
  exit. A figure counting up: the figure is the value and changes at once. A
  mark waiting off to one side until it is seen: a value never waits. A
  scale that rescales to every new reading, moving every mark.
- **Replaces.** Observatory's settle role. Not Space's `@keyframes settle`,
  which is appear, nor Relay's `settle`, which is exit.

#### draw

- **Meaning.** A trace draws itself from its start the first time it is seen.
- **Mechanics.** The path takes `pathLength="1"` and `stroke-dasharray: 1`
  and runs `kin-draw`, from `stroke-dashoffset: 1`. Bands and areas that
  belong to it fade in alongside it for the same time. Only the first sight
  draws; new data extends the trace without drawing it again. It repaints
  every frame, so it suits a few traces, not hundreds.
- **Less motion.** Whole from the start.
- **Examples.** Expressive: an instrument's trace drawing as it is scrolled
  to (Observatory). Productive: none.
- **Counterexamples.** A chart drawn again on every refresh. A dashed trace,
  whose dashes are already its dasharray: it fades instead.
- **Replaces.** Observatory's draw role and `entry-draw`.

#### appear

- **Meaning.** Content arrives: words, marks, rows, posts, a reading tip, a
  highlight.
- **Mechanics.** `kin-appear`: from transparent, from
  `translate: var(--kin-appear-from)` (0 0.25rem) and from
  `scale: var(--kin-appear-scale)` (1). Its forms are fade (`kin-fade`, for
  what opens in place), rise (the default), grow (a mark scales up at its
  anchor) and open (an inserted row or a disclosed region grows its height,
  once).
- **Less motion.** Whole. When the motion is how the reader learns that
  something is new, a still mark, a tint or the tone bar, holds for one trace
  period instead.
- **Examples.** A new row in a list, whether the reader added it or new data
  brought it; a section opening; the words of a reading arriving with each
  new choice.
- **Counterexamples.** The first paint in the productive register: content
  is simply there. A value changing: settle. An element placed by
  `translate`: it fades instead, so the rise does not move it.
- **Replaces.** Space's `@keyframes settle`, `entry-fade` and `unfold`;
  Relay's `relay-appear`, `relay-rise`, `lift` and `bloom`; Observatory's
  appear role.

#### stagger

- **Meaning.** The step between the members of one group arriving together,
  in reading order.
- **Mechanics.** Each member waits its index times `--kin-duration-stagger`,
  after any wait for an earlier part. A group has at most about a dozen
  members; a longer group arrives as one.
- **Less motion.** No step: the group is whole.
- **Examples.** Expressive: a dial's marks arriving 45ms apart. Productive:
  none.
- **Counterexamples.** Two hundred search results arriving one by one.
  Members arriving out of reading order.
- **Replaces.** Observatory's stagger role and `--entry-i`.

### Place

#### navigate

- **Meaning.** The reader moves to another place.
- **Mechanics.** A view transition on the document. Onward and back, the
  page slides 3rem the way the index runs while the chrome holds still;
  opening something zooms from where it was touched, and returning zooms
  back out. At 0ms a script skips `startViewTransition`.
- **Less motion.** The new place at once.
- **Examples.** Expressive: Observatory's rooms. Productive: none; Space,
  Relay and the site change pages at once.
- **Counterexamples.** A tab within a page: appear, as a fade. An anchor
  within a page: the browser's scroll.
- **Replaces.** Observatory's journey. "Journey" reads as a user journey,
  and CSS names this navigation.

### Work in flight

#### trace

- **Meaning.** Work is in flight, and a light runs along an edge while it
  runs.
- **Mechanics.** A dash travels round a closed path (`stroke-dashoffset`), or
  sparks drift along a line, one lap per period. It starts in the frame the
  work starts and stops in the frame it ends, when close takes over. A
  caption names the work; the light is `aria-hidden="true"`.
- **Less motion.** A whole, steady outline.
- **Examples.** The corner key's light while a turn runs; the live edge's
  sparks for background work.
- **Counterexamples.** A light running along a chain of tiles with no work
  behind it. A line down a row that a change has already touched: the change
  has landed, so the row takes the tone bar.
- **Replaces.** "Edge light" and "working light".

#### sweep

- **Meaning.** Work of unknown extent is in flight, and a band crosses its
  placeholder or bar.
- **Mechanics.** A band of light moves across (`background-position` or
  `translate`), once per period.
- **Less motion.** The plain shape. An indeterminate bar's band rests in the
  middle.
- **Examples.** A skeleton while its content loads; an indeterminate progress
  bar.
- **Counterexamples.** A determinate progress bar, whose fill follows its
  work: surface. A shimmer on a card with nothing loading.
- **Replaces.** "Skeleton pulse". Space's caption shimmer is Space's own
  signature.

#### pulse

- **Meaning.** A mark breathes in place while its work runs.
- **Mechanics.** Its opacity eases down and up once per period.
- **Less motion.** The mark stands lit.
- **Examples.** The running status mark; a live log entry's marker.
- **Counterexamples.** Ten lamps flashing as ten instruments report: one
  steady line says it. A badge pulsing for attention.
- **Replaces.** "Blink" and "breathe" said of a mark.

#### pass

- **Meaning.** Work is in flight, and a signal steps from mark to mark.
- **Mechanics.** Three marks, one lit at a time, stepping on `steps(1, end)`,
  so each holds for a third of the period. It never spins.
- **Less motion.** Every mark lit.
- **Examples.** `.kin-spinner`; the corner key's reconnecting dots.
- **Counterexamples.** A rotating ring. A spinner beside a shimmer for the
  same work.
- **Replaces.** The update spinner's turn.

#### close

- **Meaning.** Work ends: its light closes into a whole line or ring, then
  goes.
- **Mechanics.** The trace's dash grows to the whole path, then fades. A
  product shows its closing state for exactly as long as the close runs.
- **Less motion.** Cleared at once.
- **Examples.** The corner key's ring when a turn ends; the live edge
  gathering when work ends.
- **Counterexamples.** A turn only no longer watched from here: it lets go
  without a ring. A layer leaving: exit.
- **Replaces.** "Gather" said of work in general.

### Words beside the terms

- **Settled.** No change is moving toward it. **Still.** Nothing moves.
  **At rest.** Arrivals have finished and no work is in flight.
- **Dwell.** A wait before or after a state: a tip's delay, the time a
  closing state is shown. A dwell is not motion. It keeps its time with less
  motion, unless it exists only to show a movement.
- **Continuous motion.** Motion that runs at rest because the thing drawn
  runs: a clock's hands. A product declares its continuous motion, and keeps
  it to the least that says what it must.

## Signatures

A signature is timing that belongs to the thing itself, which no term can
carry: an escapement's gait, a time-lapse's length, the live edge's band. A
preference is never a signature; a preference is a calibration of a term,
and comes to Design.

A signature is defined once, where the thing is defined, with a comment
containing `signature:` and its reason, and it states:

- what it represents;
- its timing and where the timing comes from;
- why no term fits;
- its form with less motion;
- whether it runs off screen;
- whether it is one of the product's continuous motions.

Design's own signatures are the live edge's band (2.4s), breath (3.2s),
reconnecting dashes (1.2s), gather (1.1s, tied to the 1100ms closing state)
and gather-in (420ms), and the corner key's glyph kick (340ms), ink (160ms),
flash, stroke stagger (18ms), spine (400ms), lift (260ms) and retract
(200ms). A product lists its own in its interface guide.

## Less motion

With less motion a change lands in the frame that makes it, and every
meaning stays.

- Content and place compute to 0ms: values land, traces are whole, groups
  arrive as one and the new place is simply there.
- `base.css` removes every transition and runs each remaining animation
  once, at once. An exit a component keeps still fires `animationend`.
- Each loop keeps a still form that says the same: a steady outline for a
  trace, the plain shape for a sweep, a lit mark for a pulse, every mark lit
  for a pass.
- A live reading steps: a seconds hand moves once a second.
- Playback a reader starts goes one step at a time.

Not like this: shortening transitions to 0.01ms, which holds each old value
for one frame, so focus sent into a panel just shown finds it hidden;
`animation: none !important` everywhere, which keeps `animationend` from
firing; a component's own block zeroing what the register already zeroes;
hiding a still form, which leaves the reader without the meaning.

## Clocks and off screen

- Live motion that shows time takes its start time from the product's
  clock: `animation.startTime = now - phase`. It never runs on a timer of the
  browser's own, and one picture has one clock.
- A frame loop starts and stops with `IntersectionObserver` and
  `visibilitychange`: the entries pattern's `frames()` runs one only while its
  element is on screen and its tab is shown.
- An entry waits behind `data-inview="waiting"` until its element is first
  seen, released by the scroll before the frame paints: the candidate
  [entries pattern](../registry/patterns/entries/README.md)'s `inview()`, or
  `firstSight()` for an entry made in script. With less motion nothing waits.
- A dwell runs on a timer, is cancelled when the state it waits for is
  superseded, and is skipped when it exists only to show a movement that
  less motion removes.

## Performance

Animate `transform`, `translate`, `rotate`, `scale` and `opacity`, which the
compositor runs without the page. Paint is acceptable for small, short forms:
a mark, an edge, a trace drawn once. Layout moves only as a one-off change
the reader caused, never in a loop; move things with FLIP instead. A frame
loop is work on every frame, so a turning hand is one compositor animation
whose start time is set from the clock, not a redraw each second.

## Checking it

Four checks hold motion to this page.

- **`kinra-check-motion`** ships with the package. It reads Design's tokens and
  checks a product's CSS and component styles: no literal duration, delay or
  curve outside a signature, no pair followed by another curve, no unknown or
  deprecated motion token, and no `kin-` keyframes of the product's own.
  By default a literal duration and curve pass only together as a term's
  pair, and a literal delay only as a step of the scale or a term's duration;
  `--strict` takes every timing from a token, and also refuses deprecated
  tokens, keyframes defined in a component and reduced-motion blocks that only
  repeat what the register does. A signature says why, in a comment containing
  `signature:` on its line or the line before. It exits 0 when clean, 1 with
  problems and 2 when it cannot read; warnings do not fail it. It reads the
  deprecated table above, so that table keeps its markers and columns.

  ```sh
  npx kinra-check-motion --strict src
  ```

- **The guard**, `tests/browser/motion-guard.spec.js` here, checks a running
  page: at rest only its declared motion runs, content is whole with every
  animation finished, less motion leaves nothing running, no loop moves
  layout, and a frame loop stops off screen. It is read rather than imported: a product copies
  it at its pinned tag and fills in its one adapt block.
- **This page's tables** are tested against `tokens.css`, so a value changed in
  one and not the other fails.
- **`/motion/`** plays every term, and its corrections measure themselves
  against their rules. Replay anything new there at a tenth of its speed
  before handing it off.

## Corrections

What was tried, how it read, and what replaced it. A correction teaches a
rule; a new one is added only when no entry here already shows it.

| Tried                                                          | Read as                                  | Replaced by                                                          | Rule    | Source                |
| -------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- | ------- | --------------------- |
| Light trailing the seconds hand, arcs riding in lanes, a glow  | Noise following the one movement         | The hands and their shadows alone                                    | 13      | Observatory `eb896ff` |
| Connectors between tiles, and a light running them each second | A busy console rather than a clear one   | Group labels; nothing running                                        | 2       | Observatory `cde5fbe` |
| Ten lamps flashing as each instrument reported                 | Blinking                                 | One steady line naming what needs a look                             | 3       | Observatory `7a780d5` |
| A strip gliding on one clock while its dots moved on another   | A jump of a column on every other second | One animation locked to the clock; each dot placed by its own second | 8       | Observatory `7a780d5` |
| The face docking itself once it had played                     | Motion the reader did not ask for        | Docking only when the console is chosen                              | 2       | Observatory `2be338a` |
| Entries playing before they were seen, or glimpsed finished    | A finished frame, then a replay          | Entries released by the scroll, in the frame they appear             | 7       | Observatory `fbbf00b` |
| Marks waiting off to one side until the ladder was seen        | Values held back                         | Every mark standing at its value until the entry plays               | 6       | Observatory `d68265b` |
| Hands redrawn by script every second                           | A page that never rests                  | One compositor animation per hand, started from the clock            | 11      | Observatory `55fa672` |
| A spinner beside the activity shimmer                          | Two signals for one piece of work        | The shimmer alone                                                    | 3       | Space 0011            |
| Layers leaving at their own speeds                             | Exits that wait to be seen               | One exit speed                                                       | exit    | Space 0065            |
| Buttons lifting under the pointer                              | Decoration                               | A change of tone                                                     | control | Design 0.2            |

## Words we retired

| Word                                       | Where                  | What it meant              | Now                                   |
| ------------------------------------------ | ---------------------- | -------------------------- | ------------------------------------- |
| animations                                 | conversation           | everything that moves      | motion                                |
| `@keyframes settle`                        | Space                  | an entrance                | appear                                |
| `settle`                                   | Relay                  | an exit                    | exit                                  |
| `lift`                                     | Relay                  | a post rising into a list  | appear                                |
| `bloom`                                    | Relay                  | a row growing its height   | appear, its open form                 |
| `rise`, `present`                          | Space                  | a layer arriving           | layer                                 |
| `dismiss`, `sink`                          | Space                  | a layer leaving            | exit                                  |
| journey                                    | Observatory            | moving between rooms       | navigate                              |
| fold                                       | Design, the principles | a control changing meaning | morph                                 |
| lift, retract                              | Design, the principles | a fill leaving             | exit                                  |
| blink                                      | a mark or a badge      | a call for attention       | retired                               |
| `settle()`                                 | Design's Svelte shell  | measuring after navigation | not motion: `navigated()`             |
| `--motion-*` roles                         | Observatory            | its own role tokens        | the `--kin-*` terms                   |
| `entry-draw`, `entry-fade`, `entry-appear` | Observatory            | entries on first sight     | draw, appear, and the entries pattern |

Specs for motion do not use smooth, subtle, snappy, natural, fluid,
delightful or playful. Write the mechanics instead.

## Decisions

- 2026-11-20 (Blake): motion is split by what moves. Controls, layers and
  work in flight move the same everywhere; content and place take a
  register, set on a page or any subtree.
- 2026-11-20 (Blake): the registers are productive, the default, and
  expressive.
- 2026-11-20 (Blake): one vocabulary, organised by what moves; Design's verbs
  and Observatory's roles survive where they fit.
- 2026-11-20 (Blake): every term has exact mechanics, examples and
  counterexamples. A standard name comes first, and a Kinra word only for a
  real gap.
- 2026-11-20 (Blake): the standard is calibrated by eye in `/motion/` before
  it is released.
- 2026-11-20 (Blake): the vocabulary and the lab are right, and the work goes
  on to 0.9.0.

### Defaults awaiting Blake's review

Taken so the work could continue; each is shown on `/motion/`.

- The shell's `settle()` is `navigated()`, with `settle()` deprecated.
- The live edge keeps its breath and blink as signatures; their still
  alternatives are beside them on `/motion/` (X1).
- Space's caption shimmer is Space's signature, not a sweep.
- Relay's line down a row a change has touched becomes the tone bar.
- Cards answer the pointer in tone, as buttons do; nothing lifts.
- Content that arrives on its own appears as content the reader asked for
  does.
- A selection indicator moving between options is part of its control.
