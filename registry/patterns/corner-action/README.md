# Corner action

Status: **candidate**. Evidence: Kinra Space's decision trays and modal
confirmations at `8589b8a`, in `src/styles/corner-key.css` and its decision
0053, "A refresh around the corner key"; and both ends of its footers, in
`src/styles/corner-actions.css` and its decision 0079, "Both ends of a footer
are corners."
The product has proved the responsibility; a second consumer is required
before promotion.

Copy the HTML and CSS. Import `canvas.css`, `components.css`, `data.css`, and
`overlays.css` from `@kinra/web/styles/` as needed by the container. No script
is required by this pattern.

Apply `kin-pattern-corner-action` to a card, surface, or native dialog,
`__footer` to its actions row, and `__key` to each action that takes a
corner. A footer's two ends are its corners:

- **The end corner** holds what finishes the surface: its confirmation or,
  where there is nothing to confirm, the action that closes it, as a quiet
  button. It comes last in document order.
- **The start corner** holds what declines or turns back (Cancel, Back,
  Decline), as a quiet button marked `data-corner="start"`. It comes first.
- **Between them**, asides, alternatives and toolbars of equal actions stay
  ordinary buttons, and stand beside the confirmation.

Each key shares its corner of the container; `--kin-pattern-action-radius`
supplies that corner and defaults to the layer radius, or the panel radius
for a dialog. A key is never ghost, so its ground shows the corner it takes.
Each grows from nothing toward its word's width, so two keys always share the
bottom edge. An action remains a normal button with its text as its
accessible name.

Mark corners only where the context has a confirmation or a close. A row of
equal actions with neither stays an ordinary row. Do not infer a corner from a
row's last button: the product marks each one. A card's primary action uses
the shared tint, leaving the page's fill available; a modal keeps its fill
while the page is inert. Use `kin-button--danger` for a destructive
confirmation. Focus draws inside the key so clipping at the container's
corner cannot cut it. Logical corners and spacing follow right-to-left text.

The consumer owns the action, validation, pending and disabled states, and
dialog focus and dismissal. It also owns the narrow step: where a footer is
too narrow for its actions on one row, let what stands between the corners
take a row of its own above them, so both keys keep the bottom edge (Space
does so below 36rem of row in trays, forms and cards, and in dialogs only on
a phone). A full-screen phone sheet rests on the screen's foot with square
corners, and each key pads its word clear of the home indicator rather than
pinning it under it. Adapt that geometry locally. Rename the classes when
product decisions enter.
