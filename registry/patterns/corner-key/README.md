# Corner key

Status: **candidate**. Evidence: Kinra Space's composer at `8589b8a`, in
`src/lib/CornerKey.svelte`, `src/lib/cornerKey.ts`, and
`src/styles/corner-key.css`. This source brings back the working engine and
its inset focus ring, logical corner, and forced-colour fixes from Space.
It requires a second consumer before promotion.

Import `@kinra/web/styles/tokens.css`. Copy the HTML, CSS, and optional
`corner-key.js` module; TypeScript consumers can copy `corner-key.d.ts` too.
The module has no dependencies, automatic initialization, global mutation,
or network use. It animates the markup the caller renders.

The key is the surface's end square, 48px by default. Place it flush in the
end of the surface's tools row, with the row as tall as the key. Set
`--kin-pattern-key-size` and `--kin-pattern-key-radius` to the size and outer
corner of that surface. Its fill clips its own inverse-ink icon, keeping every
frame legible. The working light closes when the caller's work ends.

Every face renders from `data-face` and CSS alone. In static markup, also set
`data-trace="live|muted"` for work in flight, and `data-lit` on a filled face
whose light is running. The module updates those visual attributes when used:

```js
import { KeyEngine } from "./corner-key.js";

const key = document.querySelector(".kin-pattern-corner-key");
const engine = new KeyEngine(key, "rest");

// Derive all three from the same product state.
key.disabled = false;
key.setAttribute("aria-label", "Send message");
engine.set("send", { turn: false });

// Call only after the product accepts the action.
engine.expectSent();
key.setAttribute("aria-label", "Stop work");
engine.set("working", { turn: true });

// Teardown disconnects observers and cancels the engine's animations/timers.
engine.destroy();
```

| Face        | Meaning                      | Typical action                             |
| ----------- | ---------------------------- | ------------------------------------------ |
| `rest`      | Nothing ready                | Disabled                                   |
| `send`      | Ready                        | Send message                               |
| `sending`   | Message on its way           | Disabled; show Stop if work can be stopped |
| `working`   | Work can be stopped          | Stop work                                  |
| `queue`     | Ready during work            | Queue message                              |
| `shell`     | Command line ready           | Run command line                           |
| `command`   | Command ready                | Run command                                |
| `uploading` | Files arriving               | Disabled                                   |
| `blocked`   | Action failed or unavailable | Disabled; explain why in text              |
| `watching`  | Another client owns the work | Disabled                                   |
| `waiting`   | Reconnecting                 | Disabled; keep the draft                   |

`turn` controls the work light independently of the face: an available command
can carry the running turn's light. The consumer owns precedence, labels,
disabled state, descriptions, and actions. Use `aria-describedby` to connect
an unavailable key to a visible explanation. The strokes are decorative and
hidden from assistive technology. `faceNames` and `pressable` are defaults to
adapt, not an application state machine.

The engine observes size, corner, direction, and reduced-motion changes. A
reduced-motion key changes in place and holds a complete outline. Forced
colours retain the stroke ink and the separate inset focus ring. The motion
reads the shared bloom, retract, lift, morph, fold, and close tokens.

Rename the copied classes and properties when product-specific choices enter.
Other icons remain static; use this engine only for a control that changes
meaning.
