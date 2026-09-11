# Brand

How Kinra, its products, and its marks are named and shown. This page is
the settled standard: consumers apply it rather than reinterpreting it, and
a change here is a change to the design system, made once and released.

It governs every Kinra surface, not only the web: a terminal interface, a
desktop login screen, a printed drawing, a README, or a release bundle
follows the same names and marks. `@kinra/web` is this repository's web
distribution; the standard travels with it but is not limited to it.
[`principles.md`](principles.md) explains the visual identity;
[`catalog.md`](catalog.md) documents the classes this page relies on;
[`../TRADEMARKS.md`](../TRADEMARKS.md) governs third-party use of the names
and marks.

## Names

- **Kinra** is the brand. It is one word, written in sentence case in prose.
  **Kinra AI LLC** is the legal entity and appears only in copyright and
  legal lines, never as a product-facing name.
- **Kin** is the one proper name in the family: the agent a person installs,
  runs, and talks to. It is never prefixed. In lowercase, _the peer_ is a
  role that Kin or another agent can fill; _harness_ is an architecture word
  for the code Kin runs on. Neither is a product name.
- **Every other product is formally "Kinra <Name>"**: Kinra Spaces, Kinra OS,
  Kinra Gateway, Kinra Site, Kinra Design, Kinra Depot, Kinra Paddock, Kinra
  Scope, Kinra Flow. Use the full form on first reference on a page and in
  metadata. Use the bare name afterwards, in commands, packages, repository
  names, and document titles. The lockup below is the full form rendered.
- **Product names are proper nouns** in written case: Spaces, not SPACES or
  spaces. A product has one name. Descriptive labels ("API Console") name a
  page or feature inside a product, never the product.

## Marks

- The package ships two brand assets: `assets/mark.svg`, the K, and
  `assets/wordmark.svg`, KINRA. The grid letterforms and the blue gradient
  are reserved for these two. No product receives grid letters, a gradient
  wordmark, or a mark of its own.
- **The wordmark alone means Kinra itself**: the kinra.ai header and footer,
  the Kinra OS login and lock screens, and other places where the brand,
  not a product, is speaking.
- **The K is the favicon and application icon of every product**, and the
  mark in every product lockup.
- The K carries its own clear space inside the SVG (a 27-unit inset on a
  300-unit grid). Do not crop it, and do not add a plate, outline, or
  shadow. Use the gradient as shipped. Where a single colour is required,
  such as print or a monochrome icon, render the same path in the text
  colour.

## The lockup

Every product, Kin included, is marked with one lockup: the K, a hairline,
and the product name as live text.

```html
<a class="kin-lockup" href="/" aria-label="Kinra Spaces home">
  <img src="mark.svg" alt="" />
  <span>Spaces</span>
</a>
```

- The K is one line of UI text tall, 22px at the default root size. The name
  sits at the UI size, in the heading weight, in written case. A 1px rule in
  the rule colour separates them, with the same gap on each side.
- The name is always text, never an image or a drawn wordmark. It is
  selectable, scales with the type, and inherits the ground.
- The lockup is always set in the mono voice, whatever voice the surface
  gives its headings. The wordmark's glyphs share one pitch, and the lockup
  continues that rhythm.
- No "by Kinra" suffix and no "Kinra" label. The K says Kinra.
- `--kin-lockup-size` scales the whole lockup; the default is `1.375rem`.
  Do not change the mark, the rule, or the name independently.

The reference catalog wears the lockup in its own header, and the brand
section of the foundations page shows it on both grounds.

`.kin-lockup` is the web rendering. A surface that cannot use the CSS
follows the same geometry: the K as tall as one line of the interface text,
a hairline, and the name in the mono face at that text size. Where the K
cannot be drawn at all, such as a terminal, the name stands alone in the
mono face and the wordmark, if shown, means Kinra rather than the product.

## Getting the assets

A web consumer imports `mark.svg` and `wordmark.svg` from the package. Any
other consumer vendors the two files from an exact commit or tag and records
the source and revision beside them, as Depot does in its `VENDORED.md`. A
consumer never redraws, re-exports, or restyles either file.

## Titles and metadata

- A document title inside a product is `<Page> · <Product>`, for example
  `Repositories · Depot`. On kinra.ai it is `<Page> · Kinra`.
- The favicon is `assets/mark.svg`.
- Attribution and copyright lines read `© Kinra AI LLC`.

## Customer-operated surfaces

When a customer operates a deployment of a Kinra product, the customer's
identity may own the chrome, and Kinra appears in a single attribution line,
for example `Kinra Scope · © Kinra AI LLC`. A deployment Kinra operates
wears the lockup. A product never adopts a customer's brand as its own.

## Retired

On 2026-09-11 the product wordmarks (facet, flow, learn, outpost, paddock,
scope, and spaces) and the Facet mark were removed from `assets/`. They
remain in Git history and in any consumer pin before that commit, but they
are not brand assets. A consumer upgrading past that commit replaces the
product wordmark with the lockup. See [`adoption.md`](adoption.md).
