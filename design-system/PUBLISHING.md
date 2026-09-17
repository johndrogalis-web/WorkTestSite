# Publishing this to GitHub

## The short version

Double-click **`publish.bat`**. It makes a clean copy of this folder at
`..\github-ready\design-system` with the 1 GB of source assets left behind.
Drag that folder onto **GitHub Desktop**. Done.

Do not use the drag-and-drop uploader on github.com — see below for why.

---

## What was actually going wrong

`design-system` contains two folders that must never reach GitHub:

| Folder | Size | What it is |
|---|---|---|
| `Images/` | ~880 MB | Source photography synced from OneDrive |
| `Logo/` | ~150 MB | Source logo files, EPS and ProRes masters |

The site itself is **226 files and 94 MB**, which is completely fine. Dragging the
whole `design-system` folder tries to send over **1 GB**.

`.gitignore` excludes both folders, but **`.gitignore` only works with git.** The
uploader on github.com does not read it and will try to send everything you drag in.
That is the trap.

---

## The limits, and which tool hits which

| Limit | Value | Applies to |
|---|---|---|
| Files per upload | **100** | github.com uploader only |
| Size per file | **25 MB** | github.com uploader only |
| Size per file | 100 MB hard block | `git push` |
| Repository size | 1 GB recommended | everything |

**The github.com uploader can never publish this site in one go.** At 226 files it is
over the 100-file cap no matter how the folders are arranged, and no restructuring
changes that. GitHub Desktop has no file-count limit and reads `.gitignore`, which is
why it is the right tool here.

---

## Step by step

**1. Double-click `publish.bat`.**

It copies everything except `Images/`, `Logo/`, `__pycache__/` and itself into
`..\github-ready\design-system`, then tells you the file count and size. Re-run it
any time — it mirrors, so the copy always matches.

**2. Open GitHub Desktop** (<https://desktop.github.com> if you do not have it).

Drag `github-ready\design-system` onto the GitHub Desktop window. It will offer to
create a repository there — say yes. Check the file list shows around 226 files. If it
shows thousands, you dragged the wrong folder.

**3. Commit, then Publish repository.**

**4. On github.com: Settings → Pages → Build and deployment**

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **`/ (root)`**

Live at `https://<org>.github.io/<repo>/` within a minute or two.

---

## If you would rather not use publish.bat

Move `Images` and `Logo` out of `design-system` — anywhere else on your machine. Then
`design-system` is clean on its own and you can drag it straight onto GitHub Desktop.
The `.gitignore` will keep them out even if you move them back later.

---

## Keeping it up to date

The HTML is generated. After editing any `.py` file:

```
python3 mk.py
```

`mk.py` rebuilds all 28 pages and fails loudly on a broken link or a missing page.
Then re-run `publish.bat` and commit in GitHub Desktop.

---

## Pre-flight check

This folder has been checked for the things that break GitHub Pages *after* upload,
which is the annoying kind:

| Check | Result |
|---|---|
| Filenames with spaces or reserved characters | none |
| Case-only filename collisions | none |
| Links whose case does not match the file on disk | none |
| Files over 100 MB | none — largest is 4.9 MB |
| Leading-underscore paths Jekyll would swallow | none, and `.nojekyll` is present |
| Total | 226 files, 94 MB |

The case check matters: Windows treats `Logo.PNG` and `logo.png` as the same file and
GitHub Pages does not, so a link can work on your machine and 404 once published.
There are none here.

---

## What is deliberately not in the repository

- **`Images/` and `Logo/`** — 1 GB of source files. The site ships optimised
  derivatives in `assets/downloads/` instead.
- **ProRes 4444 animation masters** — 25 MB each. The WebM with alpha (65 KB) covers
  every web use; editors take the ProRes from `Logo/Animation/MOV`.
- **Print-resolution photography** — the 4096px Large tier covers print to about 13
  inches at 300dpi. Large-format work goes back to the source files.
