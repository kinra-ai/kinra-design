# PocketID backgrounds

Backgrounds for the Kinra-operated Pocket ID sign-in surface.

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
