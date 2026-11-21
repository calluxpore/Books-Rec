"""
Build js/books.js from the Obsidian "Book Database" folder.

The Obsidian base (Book Database.base) shows every note whose folder contains
"Book Database". This script reads the same notes, so the site lists the same books.

Usage (from the repo root):
    python tools/build_books.py
    python tools/build_books.py "D:/path/to/Book Database"

Covers, in priority order:
  1. A file you drop in assets/covers/ named after the book's id
     (e.g. assets/covers/project-hail-mary.jpg). Any of .jpg .jpeg .png .webp .avif.
  2. The `cover` URL in the note's frontmatter.
  3. A pasted image from the vault named in `cover` (copied into assets/covers/).
  4. Blank: the site draws a lettered placeholder tile.

Needs PyYAML:  pip install pyyaml
"""

import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
VAULT = Path(r"D:\Vault\Sammy.Decimal")
DEFAULT_SRC = VAULT / "00-09 🐧 System" / "04 Database" / "Bases" / "Book Database"
COVERS = ROOT / "assets" / "covers"
OUT = ROOT / "js" / "books.js"
# Fallback descriptions for notes with an empty Summary section, keyed by book id.
DESCRIPTIONS_FILE = ROOT / "data" / "descriptions.json"
DESCRIPTIONS = json.loads(DESCRIPTIONS_FILE.read_text(encoding="utf-8")) if DESCRIPTIONS_FILE.exists() else {}
IMG_EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif")

# Site-only rules. Your Obsidian notes are never changed.
EXCLUDE_SERIES = {"goosebumps"}   # series to leave off the site (lowercase)


def norm_name(s):
    """'K.F. Breene', 'KF Breene', 'k. f. breene' all become 'kfbreene'."""
    return re.sub(r"[^a-z]", "", str(s).lower())


EXCLUDE_AUTHORS = {norm_name(a) for a in ["K.F. Breene"]}   # authors to leave off the site
FORCE_STATUS = "read"             # show every book as this status; set to None to use each note's status

# Covers shown in the hero collage, in slot order (book ids from js/books.js):
#   1 large centre · 2 left · 3 top edge · 4 top right · 5 right · 6 bottom edge
# Leave the list empty to show six random covers that change daily.
HERO_BOOKS = [
    "project-hail-mary",
    "harry-potter-and-the-philosophers-stone",
    "the-abc-murders",
    "a-murder-is-announced",
    "dumb-witness",
    "the-mussoorie-murders-by-divyaroop-bhatnagar",
]

OWNER = "Samarth"
TAGLINE = "Every book I've finished, shelved by genre. Open any cover to see what it's about."

STATUS = {
    "read": "read", "completed": "read", "finished": "read", "done": "read",
    "started": "reading", "reading": "reading", "in-progress": "reading",
    "to-read": "want", "triage": "want", "want": "want",
}
FORMAT = {"audio": "audio", "audiobook": "audio", "ebook": "ebook"}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^\w\s-]", "", s.lower())
    return re.sub(r"[\s_-]+", "-", s).strip("-") or "book"


def blank(v):
    return v is None or (isinstance(v, str) and v.strip().lower() in ("", "null", "none"))


def clean(v):
    """Strip wikilinks, markdown emphasis and stray quotes from a string."""
    if blank(v):
        return None
    s = str(v)
    s = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", s)
    s = re.sub(r"\[\[([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"\*\*|__", "", s)
    s = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"\1", s)
    return s.strip() or None


def as_list(v):
    if blank(v):
        return []
    if isinstance(v, list):
        return [x for x in (clean(i) for i in v) if x]
    return [x.strip() for x in re.split(r",", clean(v) or "") if x.strip()]


def num(v):
    if blank(v):
        return None
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return None


def summary(body):
    m = re.search(r"^#{2,}\s*Summary\s*$\n(.*?)(?=^#{1,}\s|^---\s*$|\Z)", body, re.S | re.M)
    if not m:
        return None
    # Bulleted notes become sentences: drop the "- " markers, end each point with a full stop.
    parts = []
    for line in m.group(1).splitlines():
        line = re.sub(r"^\s*(?:[-*+]|\d+[.)])\s+", "", line).strip()
        if not line:
            continue
        line = line[0].upper() + line[1:]
        line = re.sub(r"(?<!\w)_([^_\n]+)_(?!\w)", r"\1", line).rstrip(",;")
        if not re.search(r"[.!?…:\"”’)]$", line):
            line += "."
        parts.append(line)
    text = clean(" ".join(parts))
    if not text or len(text) < 12 or text.lower().rstrip(".") == "no description available":
        return None
    return text if len(text) <= 600 else text[:597].rsplit(" ", 1)[0] + "…"


def find_local_cover(book_id):
    for ext in IMG_EXT:
        p = COVERS / (book_id + ext)
        if p.exists():
            return p
    return None


def find_vault_file(name):
    name = name.strip().strip("![]")
    for dirpath, _, files in os.walk(VAULT):
        if name in files:
            return Path(dirpath) / name
    return None


def read_note(path):
    text = path.read_text(encoding="utf-8-sig")
    m = re.match(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not m:
        return {}, text
    return (yaml.safe_load(m.group(1)) or {}), text[m.end():]


def build(src):
    notes = sorted(p for p in src.iterdir() if p.suffix.lower() == ".md")
    books, ids, report = [], set(), {"no_cover": [], "no_summary": [], "local": [], "copied": [], "missing_image": []}

    skipped = []
    for p in notes:
        fm, body = read_note(p)
        title = p.stem  # the base lists file.name, so the file name is the title
        authors = {norm_name(a) for a in as_list(fm.get("author"))}
        if str(clean(fm.get("series")) or "").lower() in EXCLUDE_SERIES or authors & EXCLUDE_AUTHORS:
            skipped.append(title)
            continue
        book_id = slug(title)
        while book_id in ids:
            book_id += "-2"
        ids.add(book_id)

        raw_status = str(fm.get("status") or "").strip().lower()
        b = {
            "id": book_id,
            "title": title,
            "author": ", ".join(as_list(fm.get("author"))) or "Unknown author",
            "status": FORCE_STATUS or STATUS.get(raw_status, "want"),
        }
        series = clean(fm.get("series"))
        if series:
            b["series"] = series
            n = num(fm.get("series_number"))
            if n is not None:
                b["seriesNumber"] = n
        genres = as_list(fm.get("genre"))
        if genres:
            b["genres"] = genres
        tags = [t.lstrip("#") for t in as_list(fm.get("tags"))]
        if tags:
            b["tags"] = tags
        for key, field in (("year", "published"), ("readYear", "Read Year"), ("pages", "pages"), ("rating", "rating")):
            v = num(fm.get(field))
            if v is None and key == "year":
                v = num(fm.get("year"))
            if v is not None:
                b[key] = v
        isbn = clean(fm.get("isbn"))
        if isbn:
            b["isbn"] = isbn
        fmt = FORMAT.get(str(fm.get("type") or "").lower())
        if fmt:
            b["format"] = fmt
        if not blank(fm.get("feature")):
            b["pick"] = True
        s = summary(body) or DESCRIPTIONS.get(book_id)  # the note's own Summary wins
        if s:
            b["summary"] = s
        else:
            report["no_summary"].append(title)

        # Cover
        local = find_local_cover(book_id)
        cover = "" if blank(fm.get("cover")) else str(fm.get("cover")).strip()
        if local:
            b["cover"] = local.relative_to(ROOT).as_posix()
            report["local"].append(title)
        elif cover.startswith("http"):
            b["cover"] = cover
        elif cover:
            found = find_vault_file(cover)
            if found:
                dest = COVERS / (book_id + found.suffix.lower())
                shutil.copyfile(found, dest)
                b["cover"] = dest.relative_to(ROOT).as_posix()
                report["copied"].append(f"{title} <- {found.name}")
            else:
                b["cover"] = ""
                report["missing_image"].append(f"{title} ({cover})")
        else:
            b["cover"] = ""
            report["no_cover"].append(title)

        books.append(b)

    known = {b["id"] for b in books}
    missing = [h for h in HERO_BOOKS if h not in known]
    if missing:
        print("WARNING: HERO_BOOKS ids not found (skipped):", ", ".join(missing))
    payload = {"owner": OWNER, "tagline": TAGLINE, "hero": [h for h in HERO_BOOKS if h in known], "books": books}
    header = (
        "/*\n"
        "  GENERATED by tools/build_books.py from the Obsidian Book Database.\n"
        "  Edit the notes in Obsidian, then run:  python tools/build_books.py\n"
        "  To add a cover, save it as assets/covers/<id>.jpg (id is listed below) and re-run.\n"
        "*/\n\n"
    )
    OUT.write_text(header + "window.SHELF = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    report["skipped"] = skipped
    return notes, books, report


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    notes, books, report = build(src)
    from collections import Counter
    print(f"Notes found: {len(notes)}   Skipped (excluded series or author): {len(report['skipped'])}   Books written: {len(books)}")
    print("Status:", dict(Counter(b["status"] for b in books)))
    print("Covers from assets/covers:", len(report["local"]), "  Books without a description:", len(report["no_summary"]))
    for k in ("copied", "no_cover", "missing_image", "no_summary"):
        if report[k]:
            print(f"{k}:", *report[k], sep="\n  ")
