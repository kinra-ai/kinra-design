# Kinra pattern registry

The registry distributes source-owned compositions rather than runtime
components. Each item begins with a real Kinra consumer, declares the stable
styles it expects, and includes framework-neutral HTML and CSS that a consumer
can copy, rename, and adapt.

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
3. Copy the HTML and CSS into the owning consumer.
4. Replace sample copy, rename the pattern classes to the consumer's prefix if
   the implementation is becoming product-specific, and preserve the stated
   accessibility contract.
5. Send generally useful improvements back here only after use proves them.

There is intentionally no install-time generator or runtime registry client.
The JSON manifest is small enough for tooling to consume later, while the
source remains usable by Astro, server-rendered templates, and plain HTML.
