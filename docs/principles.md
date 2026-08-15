# Design principles

## One identity, different surfaces

Consistency comes from a shared vocabulary, not identical page templates.
Learning may favor a mono, focused reading environment; documentation may favor
denser navigation and sans-serif prose; an install page may need one clear
action. They should still agree on colour roles, type scales, spacing, focus,
motion, and the treatment of bounded surfaces.

## Role before hue

Tokens describe purpose: `primary`, `reason`, `success`, `warning`, and
`error`. A colour may change without forcing consumers to rename their intent.
Cyan is the live signal and public voice; periwinkle is the quieter reasoning
channel. Status colours are reserved for actual status.

## Calm by default

Ground and structure stay quiet so meaningful state can carry contrast.
Whitespace, alignment, and rules establish most hierarchy. Elevation is for
temporary, interactive, or bounded decision surfaces rather than every block
of content. The default canvas is flat graphite with one quiet top wash.
Surfaces begin square and line-bound; radius and shadow must communicate a
real layer or interaction.

## Structure before signal

Typography, measure, alignment, and whitespace should make a page legible
before cyan, periwinkle, or status colour is introduced. A muted second voice
can carry contrast inside a headline without turning colour into decoration.
The shared responsive frame keeps that structure recognizable while leaving
each consumer's composition its own.

## Motion has a cause

Motion explains causality, progress, or spatial change. It does not make an
idle surface look alive. A looping animation must correspond to work that is
currently happening. Reduced-motion users receive the same meaning through
text, colour, shape, position, and focus.

## Accessible at the foundation

Focus is visible, colour is not the only signal, touch targets remain usable,
and prose survives text zoom and long content. Hover is an enhancement.
Components that cannot preserve those properties do not belong in the shared
layer.

## Earn abstraction

Tokens and assets are shared immediately because drift there is already
visible. A component moves here only after two consumer implementations reveal
the same stable responsibility. The shared package should remove duplication,
not centralize speculation. Kinra Site and Depot independently established the
quiet canvas and responsive frame before those patterns moved into this
foundation.
