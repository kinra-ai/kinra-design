# Design principles

Amended 2026-09-28 (Blake): layers, lines, the corner, light, and motion now
follow the corner key refresh described in [`refresh-plan.md`](refresh-plan.md),
so that every Kinra surface reads as one integrated system. Version 0.3 carries
Space's soft layers and controls. Corner actions and
the live edge remain candidate registry source; the plan records their
consumer evidence and promotion boundary.

## One identity, different surfaces

Consistency comes from a shared vocabulary, not identical page templates.
Learning may favor a mono, focused reading environment; documentation may favor
denser navigation and sans-serif prose; an install page may need one clear
action. They should still agree on colour roles, type scales, spacing, focus,
motion, and the treatment of bounded surfaces.

## Range is part of the identity

A system that can only say one sentence produces the same page everywhere,
and a narrow vocabulary pushes every author, human or peer, toward the same
three components. Kinra therefore carries deliberate range inside one
identity: two grounds (graphite and paper), three voices (mono, serif, sans),
five surface recipes, and a component vocabulary broad enough that the right
element exists for the job. Range is expressed through roles and axes that
compose, never through a theme switcher that swaps the identity out.

## Role before hue

Tokens describe purpose: `primary`, `reason`, `success`, `warning`, and
`error`. A colour may change without forcing consumers to rename their intent.
Cyan is the live signal and public voice; periwinkle is the quieter reasoning
channel. Status colours are reserved for actual status. Every role resolves on
both grounds, so a role is a meaning, not a swatch.

## Calm by default

Ground and structure stay quiet so meaningful state can carry contrast. Tone,
whitespace, and alignment establish hierarchy. The default canvas is flat
graphite with one quiet top wash; an application frame sets its chrome on the
deepest ground and its work on one raised panel. Type stays at reading scale:
a display statement is set larger than prose, not at poster size, and most
pages open with a plain title and one sentence.

## Layers are soft, marks are exact

A surface's shape says which layer it is. The page panel, the cards and
composers on it, and the rows inside them each sit a step apart in tone, and
their radii step down as they nest. Shadow belongs only to what floats above
the page: a composer over a scrolling conversation, a panel, a dialog. What
floats has an edge of its own tone, a hairline dark on paper and light on
graphite, and at most a short shadow, black on graphite, so depth reads as
cleanly on an OLED screen or over pure black as on paper. Content inside a
layer stays flat. Marks stay exact: the mark, badges, avatars,
markers, and switches are square, because nothing small is rounded to look
friendly.

## A line is a signal, not a divider

A line is drawn only where it says something: focus, work in flight, content
scrolled beneath a bar, a drop target, or the rules of a table read across.
Everywhere else a step in tone or a gap in space separates things. The
lockup's hairline is part of the mark and stays.

## The mark

Kinra's wordmark is built from square blocks on a grid. The system borrows
exactly one ornament from it: a small square that marks where state lives.
It leads an eyebrow, sits before a status word, marks the corner of a toned
surface, ticks the start of a rule, steps through a spinner, and anchors a
log entry. Colour names the state; the square only points at it. No other
decoration is introduced, and the square is never used where there is no
state to mark. The grid letterforms stay in the K and the wordmark: controls
draw their icons as plain strokes rather than rebuilding them from the mark's
blocks. How the K, the wordmark, and product names are used is settled in
[`brand.md`](brand.md).

## The corner

A surface that exists to take or confirm an action carries that action in its
end corner, where reading finishes: the lower right in a left-to-right
language. The action sits flush, sharing the surface's edge and outer radius,
and all of it answers a press: a square key where an icon says enough, a
wider one where the action needs a word. It appears wherever the context has
one primary action (a composer's send key, the answer to Kin's question, a
dialog's confirmation, a search field's keycap, a card built around one
action). A footer's two ends are both corners: where nothing is left to
confirm, the end corner holds the close, quiet, and the way back (cancel,
back, decline) takes the start corner, quiet, as the mirror of what goes
forward. What stands between them stays an ordinary control. A surface with
neither a confirmation nor a close, or with several equal actions, has no
corner action. The corner mark at a toned surface's origin says where state
lives; the corner action at its end says what happens next.

## Light means something

A fill in the primary colour means an action can happen now, and one thing on
a screen at a time carries it. A light running along an edge means work is in
flight; when the work ends it closes into a ring and fades. Status colours
stay reserved for actual status, so a destructive corner action takes the
error tone rather than the primary fill.

## Structure before signal

Typography, measure, alignment, and whitespace should make a page legible
before cyan, periwinkle, or status colour is introduced. A muted second voice
can carry contrast inside a headline without turning colour into decoration.
The shared responsive frame keeps that structure recognizable while leaving
each consumer's composition its own.

## Sequence must be real

Numbers communicate order, progression, stable reference, or identity. They
are not the default decoration for a heading or section. When a number carries
meaning, render it in the document rather than generating it from visual CSS;
when it carries no meaning, omit it. A surface can remain recognizably Kinra
through measure, voice, tone, and signal without repeating one numbered
editorial pattern.

## Motion has a cause

Motion explains causality, progress, or spatial change. It does not make an
idle surface look alive. Kinra's motion has five verbs: bloom grows from an
anchor when something becomes possible, lift moves toward where a thing went,
fold changes a control's meaning in one movement, trace shows work in flight,
and close ends it. Layers arrive from where they live and leave with a fade. A
looping animation must correspond to work that is currently happening. Settled
states are still, and every frame of a transition stays legible.
Reduced-motion users receive the same meaning through text, colour, shape,
position, and focus.

## Accessible at the foundation

Focus is visible, colour is not the only signal, touch targets remain usable,
and prose survives text zoom and long content. Hover is an enhancement.
Overlays use native `dialog` and `popover` so focus, dismissal, and the top
layer come from the platform. Components that cannot preserve those properties
do not belong in the shared layer.

## Earn abstraction

Tokens and assets are shared immediately because drift there is already
visible. Generic, accessible control vocabulary is shared early for the same
reason: when a product needs a breadcrumb, a dialog, or a toast, and the
package has none, it either builds a divergent one or misuses the nearest
thing it has, and both make the fleet look samey and slightly wrong. Every
generic component here has evidence of the same responsibility being rebuilt
in at least two Kinra products.

Higher-level patterns still earn their place. A pattern may enter the source
registry as a candidate after one real consumer proves the need, because the
consumer copies and owns that code. Promotion to a stable package contract
still requires two consumers and compatibility review. The shared package
should remove duplication, not centralize speculation.

## Ownership rises with specificity

Foundations and accessibility contracts are shared because drift there is
costly. Layout compositions describe relationships without content. Generic
controls carry only stable behavior and state. Page patterns are distributed
as source, then adapted and owned by the consumer. Routes, copy, workflows,
and product-specific views never move here merely to create visual uniformity.
