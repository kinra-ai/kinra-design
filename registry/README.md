# Kinra pattern registry

The registry distributes source-owned compositions rather than runtime
components. Each item begins with a real Kinra consumer, declares the stable
styles it expects, and includes framework-neutral HTML and CSS that a consumer
can copy, rename, and adapt. A pattern may also carry an optional framework-free
JavaScript module for motion that CSS alone cannot express. All states must
render correctly without it; it has no dependencies, automatic initialization,
global mutation, or network use, and it honors reduced motion.

Registry items are deliberately different from package classes:

- **candidate** — proven by one real consumer, available for reuse, and free to
  change before promotion;
- **stable** — the same responsibility has survived use in at least two
  consumers and follows the package's compatibility policy;
- **deprecated** — retained with migration guidance until the next permitted
  breaking release.

## Use a pattern

1. Find the item in [`registry.json`](registry.json) and read its local
   `README.md`.
2. Import the item's declared `requires` entry points from `@kinra/web`.
3. Copy the HTML and CSS, and any optional module the item documents, into the
   owning consumer.
4. Replace sample copy, rename the pattern classes to the consumer's prefix if
   the implementation is becoming product-specific, and preserve the stated
   accessibility contract.
5. Send generally useful improvements back here only after use proves them.

There is intentionally no install-time generator or runtime registry client.
The JSON manifest is small enough for tooling to consume later, while the
source remains usable by Astro, server-rendered templates, and plain HTML.

The corner action, corner key, and live edge bring back Kinra Space's refresh.
The corner action and corner key remain candidates with one consumer's
evidence. The live edge is stable since 2026-11-20, when Kinra Relay's copy
joined Space's; it is still source each product copies and owns. The
reference catalog's `/refresh/` page demonstrates all three: their states,
static rendering, and motion.

The entries pattern carries Kinra Observatory's first-sight entries: a trace
that draws, a band that fades and marks that arrive in turn, held until their
instrument is first seen. It is a candidate with Observatory's evidence, for
expressive subtrees only; `/motion/` plays the terms it uses.
