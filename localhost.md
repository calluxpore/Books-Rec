# Design Map

Source: http://localhost:5173/ (filter bar, hero and neighbouring bands), 1440×900 viewport. Reference taste: pinterest.com.md.

## Spacing Scale
- Base unit: 8px
- Chip gap: 8px
- Bar padding: 12px vertical
- Filter bar to feed heading: 24px
- Masonry gutter: 16px

## Font Hierarchy
- Hero: 48px / 900
- Feed heading: 28px / 700
- Controls (chips, sort): 14px / 500
- Count line: 14px / 400

## Color Palette
- Background (dark): #111111
- Chip fill (dark): #262625
- Control fill (dark): #2E2E2C
- Selected chip: inverse (white on dark, black on light)
- Accent, actions only: #E60023

## Image Ratios
- Pin: natural ratio at 236px column width

## Component Tokens
- Content column: masonry width (1244px at 1440), edges 91px / 1335px
- Before: top bar edges 16px / 1409px; control heights 48 / 40 / 36 / 36px; sticky bar 124px
- Target: every band on the 91px / 1335px edges; every filter control 40px; sticky bar 64px
- Radius: 20px (40px controls), 16px (tiles), 50% (arrows)
- Shadow: 0 3px 12px rgba(0,0,0,0.2) on scroll arrows only

## Hero Tokens
- Before: 372px tall, centred, 0 images, text block 377px–1049px, 4 stat pills at 36px, first book card at 627px
- Pinterest reference: 1140px container at x=143; heading 48px / 900, -0.5px, 52.8px line-height, left-aligned; buttons 48px, 16px radius, 8px gap, #E60023 + #E5E5E0; collage 522×450px, 6 tiles, 2.2× size range, 2 tiles bleed off the top
- Target: two columns on the 91px / 1335px edges; 6 real covers, one anchor, overlap, 2 bleed edges; Browse the shelf (red) + Surprise me (grey) at 48px, 16px radius; stats as one 14px text line

---

# Taste DNA

### One column edge from top bar to last tile
- **Trigger**: When a sticky header, filter bar and masonry stack vertically.
- **Decision**: One shared left/right edge (the masonry width) over a full-bleed top bar above a centred content column.
- **Reason**: The eye runs down a shared edge; a 75px jog between bands reads as an accident.
- **Evidence**: Logo left 16px vs content left 91px; search right 1345px vs content right 1335px.

### One control height per strip
- **Trigger**: When chips, segment buttons, sort and arrows share a bar.
- **Decision**: 40px for every control with aligned centres over per-control sizing.
- **Reason**: A shared height and centre line make separate parts read as one toolbar.
- **Evidence**: 48 / 40 / 36 / 36px in one bar; two rows with centres at 116px and 172px.

### Only show filters that can narrow the list
- **Trigger**: When every book has the same status.
- **Decision**: Remove the status control and the per-tile Read badge over keeping them for completeness.
- **Reason**: A filter that cannot change the result and a badge on every tile are noise people learn to skip.
- **Evidence**: Read 243 = All 243; Reading now 0, To read 0; Read badge on 243 of 243 tiles.

### One sticky row, not two
- **Trigger**: When a filter bar stays pinned over a tall masonry feed.
- **Decision**: Genres and sort in one 64px row over a two-row 124px block.
- **Reason**: Pinned height is taken from every screenful of covers, and covers are what people came to see.
- **Evidence**: 124px sticky = 14% of a 900px viewport; one row = 64px = 7%.

### Let the shelf introduce itself
- **Trigger**: When the hero is the first thing on a site made of book covers.
- **Decision**: A collage of 6 real covers from the shelf over a headline-only banner.
- **Reason**: People judge in one glance whether a shelf matches their taste, and covers say that faster than any tagline.
- **Evidence**: 0 images in the current hero; Pinterest gives 46% of its hero width to a 6-tile collage.

### One left edge from the headline down
- **Trigger**: When the hero sits above a left-aligned feed.
- **Decision**: A left-aligned text column on the 91px content edge over centred text.
- **Reason**: A centred island breaks the line people follow down the page; a shared edge carries them into the books.
- **Evidence**: Centred text block 377–1049px vs content 91–1335px; Pinterest heading at x=143, its container edge.

### Composed, not gridded
- **Trigger**: When arranging several images in a small space.
- **Decision**: Overlapping covers at five sizes with one anchor and two bleeding off the frame over an evenly spaced row.
- **Reason**: An even row reads like a shop shelf; an off-balance cluster reads like a desk mid-reading.
- **Evidence**: Pinterest collage has a 2.2× size range; 2 of 6 tiles bleed off the top.

### Quiet facts, loud verb
- **Trigger**: When the hero has numbers and actions competing.
- **Decision**: Stats as one 14px text line, red only on Browse the shelf and grey on Surprise me, over four boxed stat pills.
- **Reason**: Boxed pills look like buttons and pull clicks; plain text informs without competing with the action.
- **Evidence**: 4 boxed 36px stat pills before; Pinterest hero has exactly 2 controls, 48px, #E60023 + #E5E5E0.
