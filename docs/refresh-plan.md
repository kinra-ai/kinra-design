# Refresh plan: the corner key

Status: exploring since 2026-09-28. Blake chose the corner key, a composer
send control drawn for Kinra Space, as the component to model a refresh of
Kinra's interfaces against. Nothing here is released, and no package class or
token has changed for it. The studies live in
[`examples/studies/`](../examples/studies/README.md).

## How it got here

The first study drew the key's icons from the wordmark's block grid, with
stepped growth and grid-only movement. Blake judged it held back by trying to
be too much like the logo. The second kept the idea, a key pinned into the
composer's corner, and executed it with plain line icons, a fill that grows
from the corner and a light that runs while work runs. That version set the
direction: Kinra's identity comes from where things sit, what light means and
how things move, not from repeating the mark.

## The grammar

- **The action lives in the corner.** The primary action of an input or
  decision surface sits flush in its lower-right corner and shares the
  surface's edge and outer radius. It pairs with the existing corner mark:
  state at the origin, action at the terminus. One corner action per surface.
- **Light means something.** A fill means the action can happen now. A light
  running along an edge means work is in flight; when the work ends it closes
  into a ring and fades. Only one thing on a screen is filled with the primary
  colour.
- **A line is a signal, not a divider.** Tone, space and alignment carry
  structure. A line appears only when it says something: focus, running work,
  content scrolled beneath a bar, a drop target.
- **Motion has five verbs.** Bloom grows from an anchor, lift moves toward
  where the thing went, fold changes a control's meaning, trace shows work in
  flight and close ends it. Settled states are still.
- **Only controls that change meaning morph.** Their icons are four strokes on
  a 24-unit grid, so any state becomes any other in one movement. Every other
  icon stays a static Phosphor glyph.
- **Every frame is legible.** Colour stays correct in the middle of a
  transition, and reduced motion keeps every meaning without the movement.

## The corner key

The key is the composer's lower-right square: 48px by default, flush with the
composer's edge and radius, with the tools row exactly as tall as the key.

- **Icon.** 44% of the key, 21px at 48px. Four strokes on a 24-unit grid with a
  2.25-unit stroke (about 2px at 48px) and round caps. A hidden stroke has no
  width and waits where it will grow from.
- **Faces.** Send is an arrow; Stop is a solid square 10 units wide with a
  2.5-unit radius; Queue is the arrow under a bar; Run is `>_`; Command is `/`;
  Can't send is `!`; Reconnecting is three dots.
- **Fill.** A clip, not a transform: it grows from the pinned corner and lifts
  out of the top. The fill carries its own copy of the icon in the inverse
  ink, clipped with it, so the icon is dark wherever it sits on the fill and
  light wherever it does not.
- **Strokes.** Each stroke is a position node holding a size node, so a stroke
  can travel and change size independently. Between a line icon and the solid
  Stop, strokes first fold into one upright line and then widen, which keeps
  them from smearing into a blob. Only a change of icon interrupts strokes
  that are still moving.
- **Light.** A 2px stroke, 24% of the key's perimeter, one lap every 1.6s,
  shown only while a turn runs or files arrive. When the turn ends it closes
  into a ring over 300ms and fades.

| Motion                        | Duration                     | Easing                       |
| ----------------------------- | ---------------------------- | ---------------------------- |
| Bloom: fill grows from corner | 260ms fill, 480ms blink      | `cubic-bezier(0.2, 0, 0, 1)` |
| Retract: fill falls back      | 200ms                        | `cubic-bezier(0.4, 0, 1, 1)` |
| Lift: fill leaves through top | 260ms, icon kicks over 340ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Morph between icons           | 320ms, 18ms stagger          | `cubic-bezier(0.4, 0, 0, 1)` |
| Fold to or from Stop          | 400ms, upright line at 45%   | fold, then morph easing      |
| Light lap                     | 1.6s                         | linear                       |

With reduced motion every face changes in place and the light holds still as a
full outline.

## The shell

- **Panel on a shelf.** The window and sidebar sit on the deepest ground; the
  page is one raised panel inset 8px, with a 12px radius and no border. Radii
  step down inside it: composer and cards 8px, rows 6px. Marks, badges and
  avatars stay square.
- **Sidebar.** 264px open and a 56px rail folded, Space's 3.5rem. Icons keep
  one column in both states, so folding moves only labels. The width moves at
  layer speed (320ms, `cubic-bezier(0.16, 1, 0.3, 1)`); labels fade out in 90ms
  and back in over 140ms after a 140ms delay; session lists fold their height
  with the width; the wordmark crossfades to the K, which sits exactly on the
  wordmark's own K.
- **Selection and work.** The active row takes the page panel's tone, tying the
  selection to the page it opened. A working session carries a short light on
  its row's leading edge; folded into the rail, the light moves to its
  workspace icon.
- **Topbar.** No border. A soft shadow appears only while content is scrolled
  beneath it. The sidebar toggle sits in the topbar, so it stays put while the
  sidebar folds. Search is a field with a ⌘K keycap in its corner.

## Slideovers

- **Kin's panel** floats as a raised card inset 8px from the window, 384px
  wide, with the float shadow and no backdrop. It arrives from the inline end
  at layer speed (380ms, `cubic-bezier(0.16, 1, 0.3, 1)`) and leaves with a fade
  and a 16px drift in 140ms. Its composer spans the card's foot, so its key is
  the card's own corner.
- **The phone drawer** arrives from the inline-start edge in 380ms as a card
  with a rounded trailing edge. The page dims and shifts 28px with it, and the
  drawer leaves faster, in 220ms.

## For Kinra Space

The key replaces `.composer-action` in `Composer.svelte`, and every face
follows from a value the composer already derives, so the native host
contract keeps its `send` and `turn` fields.

| Face         | Shown when                         | Accessible name                   |
| ------------ | ---------------------------------- | --------------------------------- |
| Rest         | nothing to send                    | Send message, unavailable         |
| Send         | `canSend`                          | Send message                      |
| Queue        | `queueing`                         | Queue message                     |
| Run          | `shellLine`                        | Run in the workspace              |
| Command      | `slashRows.length`                 | Run command                       |
| Sending      | `sending`                          | Sending…                          |
| Stop         | `active && connected && !observer` | Stop Kin                          |
| Uploading    | `uploading`                        | unavailable; status line says why |
| Can't send   | `failed` or `!admitted`            | unavailable; status line says why |
| Watching     | `observer`                         | unavailable while watching        |
| Reconnecting | `reconnecting`                     | unavailable; the draft is kept    |

Changes this brings to Space:

- Stop leaves the error colour for a neutral key with a running light, since
  stopping Kin is not a failure.
- The tools row grows from 36px to 48px.
- The light while files arrive shows that work is happening, not how much
  remains; Space has no upload progress today.
- The iPhone app draws a native SwiftUI composer, so the key needs its own
  SwiftUI build there. The Mac uses the page's composer and gets it directly.

## Adoption path

1. Build `CornerKey.svelte` in kinra-space around the study's engine, on a
   branch, and live with it in a real home.
2. Carry the grammar into Space's sidebar, panels and Home.
3. Bring back to this repository what proves itself: motion tokens, the corner
   action and the edge light as candidate registry patterns, and the
   principles update. The registry has held HTML and CSS only; a pattern that
   needs script would be the first.
4. Promote nothing to a stable contract before a second consumer, likely
   Gateway's request console, uses it.

## Decisions still open

- `docs/principles.md` says surfaces begin square and line-bound. The refresh
  keeps marks, badges and avatars square but rounds layers and removes divider
  lines. That is a change to the principles, not a detail of one component.
- Whether the corner action takes the primary action of dialogs, not only of
  composers and Kin's questions.
- Whether the registry accepts a pattern that carries script.
