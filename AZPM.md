# AZPM layer

This branch (`azpm`) is the [Project+ Stream Tool](https://github.com/ilikepizza107/Project-Plus-Stream-Tool)
plus the AZPM overlays. Everything AZPM lives in new files, so upstream updates merge cleanly.
Usage notes for streamers are in [Stream Tool/AZPM Readme.txt](Stream%20Tool/AZPM%20Readme.txt).

## What the layer adds

| Path | What |
|---|---|
| `Stream Tool/Resources/AZPM/` | all AZPM css, scripts, art, fonts and stinger transitions |
| `Stream Tool/AZPM Singles.html`, `AZPM Doubles.html`, `AZPM Commentary.html` | game layouts, ported from the AZPM 2022 Stream Tool v1.5 |
| `Stream Tool/copytitle.bat` | VOD title to clipboard |
| `Stream Tool/AZPM Readme.txt` | usage notes that ship in the zip |
| `AZPM Dev/` | render helpers, sample data, reference renders, zip script (not shipped) |

The thumbnail export (`Resources/AZPM/Scripts/Thumbnail.js`, run by the exe) loads `VS Screen.html`
in a hidden offscreen window, waits 4 s for the intro, and saves a 1280x720 PNG to `Thumbnails/`.
The window is 1280x720 with the page zoomed to 2/3: a 1920x1080 window gets clamped to the
screen height on a 1080p monitor and squashes the page.

The game layouts get their data from the GUI over the same websocket as the stock scoreboards
(`Resources/AZPM/Scripts/Layout.mjs`), and reuse upstream's `Utils` modules and SVG icons.

## Upstream files that are edited

Only the VS Screen and the thumbnail button needed edits in upstream files. Each edit is marked with `AZPM`:

| File | Edit |
|---|---|
| `Stream Tool/Resources/GUI.html` | thumbnail buttons in settings + one script tag (added lines only) |
| `Stream Tool/Resources/Scripts/Executable.js` | one line that loads `AZPM/Scripts/Thumbnail.js` |
| `Stream Tool/VS Screen.html` | AZPM css link, background video, AZPM layer image, name lines (added lines only) |
| `Stream Tool/Resources/Scripts/VS Screen.js` | one import and one call |
| `Stream Tool/Resources/Scripts/VS Screen/Player/Player Name.mjs` | 2 text sizes |
| `Stream Tool/Resources/Scripts/VS Screen/Round Info/Round Info.mjs` | 2 text sizes |
| `Stream Tool/Resources/Scripts/VS Screen/Caster/Caster.mjs` | 1 text size |
| `README.md` | one line pointing here |

`git diff <upstream tag> azpm -- . ":!Stream Tool/Resources/AZPM" ":!AZPM Dev"` shows exactly these.

## Merging an upstream update

```bash
git remote add upstream https://github.com/ilikepizza107/Project-Plus-Stream-Tool.git   # once
git fetch upstream --tags
git checkout azpm
git merge v2.4.0          # the new release tag, or upstream/master
```

- A conflict can only happen in the files of the table above. Keep upstream's version of the
  conflicting lines and put the `AZPM` marked lines back (they are listed by `git grep -n AZPM -- "Stream Tool" ":!Stream Tool/Resources/AZPM"`).
- If upstream renamed things the AZPM css relies on (ids and classes of `VS Screen.html`), the merge
  is clean but the look breaks. So after every merge, render and compare:

```bash
bash "AZPM Dev/render-all.sh"      # writes AZPM Dev/renders/new-*.png; close the Stream Tool GUI first
```

  Compare with the committed renders (`git diff --stat`, or just open them), then commit the new ones.
- The game layouts only depend on the data the GUI sends (`Resources/Scripts/GUI/Write Scoreboard.mjs`)
  and on `Resources/Scripts/Utils/WebSocket.mjs` / `Resize Text.mjs`.

## Building the zip

The repository has upstream's character set. The AZPM team uses its own (their build's
`Resources/Characters` and `Resources/Texts`), and the exe is not in the repository. The zip is
therefore built on top of an unpacked build that has those:

```bash
bash "AZPM Dev/build-zip.sh" "D:/Stream Tools/AZPM Stream Tool 3.2.1" 3.2.1-azpm2
```

It takes characters, texts and the exe from that folder and every other file from this repository,
and writes `AZPM Dev/dist/AZPM Stream Tool <version>.zip`.
For a new upstream release: unpack the new upstream build, copy the AZPM `Resources/Characters`
and `Resources/Texts` over it, and use that as the base folder.

## Rendering without the GUI

```bash
cd "AZPM Dev"
node serve.js "../Stream Tool" sample.json 8080      # static server + websocket that sends the sample data
node capture.js "http://127.0.0.1:8080/AZPM%20Singles.html" out.png 4000
```

`capture.js` uses headless Chrome and prints the page's console errors. `renders/` has each overlay
next to its old counterpart (`old-*.png` from the 2022 tool, `new-*.png` from this branch).
