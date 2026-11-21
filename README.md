# My Shelf

A static book-recommendation site: what I'm reading, what I've read, and what I recommend. Plain HTML, CSS and JS, no build step.

## Update the books

The book list comes from the Obsidian **Book Database** folder (the same notes `Book Database.base` shows). After editing notes in Obsidian, regenerate the data from the repo root:

```
pip install pyyaml
python tools/build_books.py
```

Two settings at the top of `tools/build_books.py` shape the site without touching your notes: `EXCLUDE_SERIES` (currently Goosebumps) leaves whole series off, and `FORCE_STATUS` (currently `"read"`) shows every book as read. Set `FORCE_STATUS = None` to use each note's own status, and the status filter reappears on its own. `HERO_BOOKS` lists the six covers in the hero collage, by book id, in slot order; leave it empty for a daily random six.

Then commit and push. Status mapping when not forced: `read`/`completed` show as Read, `started` as Reading now, `triage`/`to-read` as To read. A non-empty `feature` makes a book a Top pick.

**Descriptions.** Each book's description comes from the Summary section of its note. For notes with an empty Summary, the build uses `data/descriptions.json` (keyed by book id). A note's own Summary always wins, so filling one in Obsidian replaces the fallback. The build prints how many books still lack a description.

**Covers.** The script uses, in order: a file in `assets/covers/` named after the book's `id` (see `js/books.js`, e.g. `assets/covers/project-hail-mary.jpg`), then the `cover` URL from the note, then a pasted image from the vault. With none of those, the site shows a coloured placeholder tile. Re-run the script after adding a cover file.

## Publish on GitHub Pages

Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.

> Keep images out of folders that start with `_`. GitHub Pages (Jekyll) skips them. The `.nojekyll` file turns Jekyll off as a safeguard.

## Preview locally

Open `index.html` directly, or run a server from the repo root:

```
python -m http.server 5173
```

## Files

```
index.html          page structure
css/styles.css      all styling (colours are tokens at the top; light + dark)
js/books.js         generated book data (don't edit by hand)
tools/build_books.py  builds js/books.js from the Obsidian vault
js/app.js           rendering, filters, search, detail view
assets/covers/      cover images
```
