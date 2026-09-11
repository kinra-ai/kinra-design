# Pocket ID background behavior

Inspected upstream revision
[`7ddc5d6`](https://github.com/pocket-id/pocket-id/tree/7ddc5d690bb2d679a4a871882a0df36cdf79b385).
The deployed Pocket ID version has not been confirmed.

## Rendering

The [login wrapper](https://github.com/pocket-id/pocket-id/blob/7ddc5d690bb2d679a4a871882a0df36cdf79b385/frontend/src/lib/components/login-wrapper.svelte)
uses the same uploaded image in two layouts:

- At viewport widths of 1024 CSS pixels and above, the image occupies a
  separate right-hand panel. The sign-in area reserves 650 pixels, rising
  to 800 pixels at the default Tailwind `2xl` breakpoint. The image uses
  `object-fit: cover`, viewport height, and the remaining viewport width.
- The panel has a 24-pixel margin and 40-pixel rounded corners. Its image
  dimensions do not subtract those margins, so the container clips another
  48 pixels horizontally and vertically. Even a centered image subject is
  slightly offset within the visible panel.
- Below 1024 pixels, the image becomes a full-page, centered `cover`
  background behind the sign-in card. A central wordmark can be obscured
  by the card.

The [animation stylesheet](https://github.com/pocket-id/pocket-id/blob/7ddc5d690bb2d679a4a871882a0df36cdf79b385/frontend/src/app.css)
adds a desktop entrance zoom from 1.3 to 1 over 0.7 seconds when the wrapper
enables animations. Composition needs extra clearance during that entrance.

The [image settings](https://github.com/pocket-id/pocket-id/blob/7ddc5d690bb2d679a4a871882a0df36cdf79b385/frontend/src/routes/settings/admin/application-configuration/update-application-images.svelte)
provide one background upload, separate from the light and dark application
logos. They do not expose a focal point, crop control, or separate mobile
background. The settings thumbnail is not a preview of the login crop.

## Why the first composition failed

Our 1672 × 941 background contains a 644-pixel-wide wordmark. Calculating
the settled desktop layout from the source gives these approximate sizes:

| Viewport in CSS pixels | Visible panel width | Rendered wordmark width |
| ---------------------- | ------------------- | ----------------------- |
| 1024 × 768             | 326 px              | 526 px                  |
| 1366 × 768             | 668 px              | 526 px                  |
| 1440 × 900             | 742 px              | 616 px                  |
| 1920 × 1080            | 1072 px             | 739 px                  |

At 1366 × 768, the wordmark fills about 79% of the visible panel. At the
desktop threshold it exceeds the panel width. At 390 × 844 on mobile,
the wordmark would render about 578 pixels wide before cropping and card
occlusion. These are calculations from upstream CSS, not measurements of
the deployed instance.

## Composition requirements

Treat the upload as artwork that tolerates cropping. A particular portrait
aspect ratio alone cannot fix every viewport. Keep any wordmark small and
near the center, with generous surrounding clearance, and let the separate
application logo identify the sign-in card on mobile. Check a narrow desktop,
an ordinary laptop, a wide desktop, and a phone, including the entrance zoom.
Judge the background's visual weight beside the form, not only as a standalone
image.
