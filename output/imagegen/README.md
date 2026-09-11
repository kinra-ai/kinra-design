# PocketID backgrounds

Backgrounds for the Kinra-operated Pocket ID sign-in surface.

## Abstract mycelium

- [Upload image: mycelium with the Kinra wordmark (SVG)](kinra-pocketid-mycelium-logo.svg)
- [Lossless 4096 × 4096 PNG fallback](kinra-pocketid-mycelium-logo.png)
- [Mycelium without the wordmark (SVG)](kinra-pocketid-mycelium.svg)
- [Desktop preview](kinra-pocketid-mycelium-preview-desktop.png)
- [Phone preview](kinra-pocketid-mycelium-preview-phone.png)

The current direction is original vector artwork: fine filaments branch and
reconnect across the lower part of a graphite field, with intentional open
space and the wordmark in the upper third. It draws from
[The Mycelium](https://kinra.ai/learn/the-mycelium/),
[The Fabric](https://kinra.ai/writing/the-fabric/), and
[Negative Space](https://kinra.ai/writing/negative-space/), read from Kinra
Site's published-content source at revision `beab40c`. These are visual
interpretations of the essays, not scientific diagrams.

Use the SVG upload for vector sharpness. It embeds the canonical
`assets/wordmark.svg` unchanged as an SVG data URI, with no external asset
requests, raster logo, blur, or lossy encoding. Its 386.4 × 72 placement
preserves the original 1610:300 aspect ratio exactly. The PNG fallback is
rendered directly from the vector composition at 4096 × 4096 with lossless
encoding. The earlier landscape WebP is not the upload for this direction.

The SVG uses a 2048 × 2048 viewBox; the wordmark begins at `(830.8, 620)`.
Its higher placement was checked for full visibility both at rest and at
Pocket ID's 1.3× entrance zoom at desktop widths of 1024, 1366, 1920, 2560,
and 3440 CSS pixels. A 390 × 844 phone check confirms that the background
wordmark sits behind the sign-in card, which retains its separate K logo.
The embedded wordmark bytes and aspect ratio were also verified.

Open `pocket-id-mycelium-preview.html` locally to inspect the responsive
composition. Preview screenshots use 2× pixel density and reproduce the
upstream background geometry with approximate form styling; they are not
screenshots of the deployed service. Source behavior is documented in the
[layout notes](pocket-id-layout-notes.md).

This artwork uses native SVG construction, not image generation. Reproduce
the two SVGs and PNG with:

```sh
node output/imagegen/render-mycelium.mjs
```

## Atmospheric landscape

- [Upload image: landscape with the Kinra wordmark (WebP)](kinra-pocketid-landscape-logo.webp)
- [PNG version](kinra-pocketid-landscape-logo.png)
- [Landscape without the wordmark](kinra-pocketid-landscape.png)
- [Desktop preview](kinra-pocketid-preview-desktop.png)
- [Phone preview](kinra-pocketid-preview-phone.png)

The landscape is 1254 × 1254 pixels. Its square canvas allows different
desktop and phone crops; the scene itself is an alpine landscape. The
canonical `assets/wordmark.svg` is centered at 226 pixels wide (18% of the
canvas), with its original paths and gradient preserved through direct SVG
compositing. The background was generated using the built-in image generation
tool; the full prompt is in `kinra-pocketid-landscape.prompt.txt`.

The WebP is the upload version; the PNG retains the lossless composite.
These files are alternatives to the original graphite backgrounds below.

The [layout notes](pocket-id-layout-notes.md) document the upstream rendering
rules. Open `pocket-id-preview.html` locally to resize the preview. Its image
geometry follows the inspected Pocket ID source; the sign-in form styling
is approximate, and these screenshots are not from the deployed instance.
The background wordmark is intentionally allowed to disappear behind the
mobile card, which carries the separate application logo.

Chromium checks covered 1024 × 768, 1366 × 768, 1920 × 1080, and 390 × 844.
The wordmark stays within the desktop panels both at rest and at the initial
1.3× zoom. At 1366 × 768 it occupies about 21% of the visible panel width,
compared with about 79% in the original composition.

## Original graphite backgrounds

- [With the Kinra wordmark](kinra-pocketid-background-logo.png)
- [Background only](kinra-pocketid-background.png)

Both PNGs are 1672 × 941 pixels. The branded version centers the canonical
`assets/wordmark.svg` at 644 × 120 pixels, preserving its paths and gradient.
The wordmark represents Kinra itself on this sign-in surface.

The background was generated with the built-in image generation tool; its
full prompt is in `kinra-pocketid-background.prompt.txt`. The final branded
version composites the SVG directly with Sharp to preserve the brand asset
exactly. A generated logo-placement draft was discarded because it softened
the mark's edges.

These are consumer handoff images, outside the package's exported assets.
