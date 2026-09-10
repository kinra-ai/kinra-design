# Narrative intro

Status: candidate · Evidence: Kinra Site

Use this pattern when a page needs to establish a position and a few grounding
facts before presenting detail. It deliberately has no sequence number: a page
introduction is not an ordered step merely because it appears first.

The statement uses the shared `.kin-display` role, so it follows the surface's
display voice: mono on most surfaces, serif under `data-kin-surface="editorial"`
or `data-kin-voice="serif"`. The evidence rail is a shared `.kin-kv` list.

Use it once per site, on the page that states the product's position. Do not
use it as the default opening for every page, for an application title bar, a
short documentation heading, or when a single direct action should dominate the
page. Ordinary pages open with a `.kin-title` and one descriptive sentence.

## Accessibility

- Keep one correctly ranked heading for the page.
- Use a real list or description list for evidence; do not create visual rows
  from unrelated `div` elements.
- Keep the statement readable without its muted typographic contrast.
