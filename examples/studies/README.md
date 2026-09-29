# Studies

Reference-only design studies for the refresh described in
[`docs/refresh-plan.md`](../../docs/refresh-plan.md). They are not exported
components, registry candidates or package contracts, they have no consumer
evidence yet, and they are not shipped in the package.

## Corner key

[`corner-key/index.html`](corner-key/index.html) is the interactive study of
Kinra Space's composer send control: a key flush in the composer's lower-right
corner whose four-stroke icon morphs between send, stop, queue, run, command
and more. Open it directly in a browser; it needs no build. Its controls
simulate Space's states, change the key's size, slow the motion to a quarter,
turn on reduced motion and switch the ground.

The `CornerKey` class in the page's script and the `.key` rules in its style
are framework-free, and they are what a consumer would port. The rest of the
page is the study's own scaffolding. The published copy is
[this artifact](https://claude.ai/artifact/ApCeYMgudXLHB8Ze4J14ZV), private to
Blake.

## Space refresh canvas

[`space-refresh/`](space-refresh/) is a snapshot of the Design canvas that
mocks up a refreshed Kinra Space around the key: its index, `canvas.json`, and
one `.dc.html` file per artboard in that canvas's component format. The files
render only inside the canvas, and their `/_blob/` image references resolve
only there; the images are this repository's `assets/wordmark-space.svg` and
`assets/mark.svg`. Keep them as a design record rather than source to copy.
They stay byte-identical to what was published, so the formatter skips them.
The published copy is
[this artifact](https://claude.ai/artifact/5mtWXuTgLUKUc7fbr6rRVP), private to
Blake.

| Artboard                | Shows                                                       |
| ----------------------- | ----------------------------------------------------------- |
| `Main.dc.html`          | A live conversation with the working key: queue, stop, send |
| `Home.dc.html`          | Home with a composer in place of Talk with Kin              |
| `Decision.dc.html`      | Kin asks, and the answer takes the key's corner             |
| `Phone.dc.html`         | The key on a phone, on Paper, queueing while Kin works      |
| `Conversation2.dc.html` | Fewer lines, the sidebar folding to its rail, Kin's panel   |
| `Home2.dc.html`         | Fewer lines, Home with the rail folded and raised tiles     |
| `Phone2.dc.html`        | Fewer lines, the phone drawer                               |
