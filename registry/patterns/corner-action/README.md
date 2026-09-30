# Corner action

Status: **candidate**. Evidence: Kinra Space's decision trays and modal
confirmations at `8589b8a`, in `src/styles/corner-key.css` and its decision
0053, "A refresh around the corner key."
The product has proved the responsibility; a second consumer is required
before promotion.

Copy the HTML and CSS. Import `canvas.css`, `components.css`, `data.css`, and
`overlays.css` from `@kinra/web/styles/` as needed by the container. No script
is required by this pattern.

Apply `kin-pattern-corner-action` to a card, surface, or native dialog,
`__footer` to its actions row, and `__key` to its one final confirmation.
Keep alternative actions before the confirmation in document order. The key
shares the container's end corner; `--kin-pattern-action-radius` supplies that
corner and defaults to the layer radius, or the panel radius for a dialog.
The action remains a normal button with its text as its accessible name.

Use this only where the context has one primary action. Equal alternatives
stay together in an ordinary row. A card's primary action uses the shared
tint, leaving the page's fill available; a modal keeps its fill while the
page is inert. Use `kin-button--danger` for a destructive confirmation.
Focus draws inside the key so clipping at the container's corner cannot cut
it. Logical corners and spacing follow right-to-left text.

The consumer owns the action, validation, pending and disabled states, and
dialog focus and dismissal. A full-screen phone sheet must keep its footer
above the safe area rather than pinning an action under the home indicator.
Adapt that geometry locally. Rename the classes when product decisions enter.
