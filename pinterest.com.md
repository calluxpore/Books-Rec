# Design Map

Source: https://www.pinterest.com/ (plus /ideas/ for the masonry grid), 1440×900 viewport.

## Spacing Scale
- Base unit: 8px
- Component: 4px, 8px, 16px, 24px
- Section: 64px, 100px
- Masonry gutter: 16px

## Font Hierarchy
- Family: Pin Sans (single family, all roles)
- Display: 70px / 900
- Section heading: 48px / 900, letter-spacing -0.5px, line-height 52.8px
- Feature heading: 38px / 700
- H1: 28px / 700, letter-spacing -0.5px
- Subhead: 20px / 400
- Nav, tabs, body: 16px / 500 (nav) and 16px / 400 (body)
- Meta: 12px / 400

## Color Palette
- Background: #FFFFFF (67% of surface)
- Band background: #F6F6F3
- Text primary: #000000, warm variant #211922
- Text secondary: #62625B
- Fill secondary (search field, secondary buttons): #E5E5E0
- Fill subtle: #EFEFEF
- Accent, primary actions only: #E60023 (0.6% of surface)

## Image Ratios
- Pin tile: fixed 236px width, height free (0.40:1 to 0.80:1 observed)
- Carousel hero: 1.90:1
- Feature: 1.16:1

## Component Tokens
- Radius: 16px (pins, buttons), 32px (feature panels holding 16px images), 12px, 8px, 50% (avatars, icon buttons)
- Shadows: 0 3px 12px rgba(0,0,0,0.2) (floating chips); 0 0 100px rgba(0,0,0,0.2) (modal); pins have none
- Buttons: pill, 16px radius, 8px 16px padding; primary #E60023 / white text; secondary #E5E5E0 / black text
- Search field: 48px tall, #E5E5E0 fill, fully rounded
- Masonry: independent columns, 236px column + 16px gutter (252px pitch), 5 columns at 1440px
- Category tabs: 16px / 500 text, black, active underline
- Motion: transform 0.085s ease-out on press; transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) pop; :focus-visible and prefers-reduced-motion present

---

# Taste DNA

### Let the image be the card
- **Trigger**: When designing a tile for content that is itself visual.
- **Decision**: Chose a bare image with a 16px radius over a framed card with border, background, padding and drop shadow.
- **Reason**: People scan by eye, and every frame line is noise multiplied across dozens of tiles.
- **Evidence**: Pin box-shadow none; 16px radius on every pin image; the page's only 2 shadows sit on floating UI.

### Keep the image's own height (masonry)
- **Trigger**: When displaying images of mixed aspect ratios side by side.
- **Decision**: Chose fixed column width with free height over a uniform-ratio grid with cropping.
- **Reason**: Cropping changes what people came to see, and staggered edges stop the page reading like a spreadsheet.
- **Evidence**: All pins 236px wide; heights 295/314/341/354/379/419/495/590px; column x = 98/350/602/854/1106 (252px pitch).

### Red only for verbs
- **Trigger**: When the brand owns a loud red.
- **Decision**: Kept #E60023 off headings, links, borders and backgrounds and reserved it for primary actions, over spreading the brand colour across the chrome.
- **Reason**: The imagery already competes for attention, so the one saturated UI colour has to mean "do this".
- **Evidence**: #E60023 covers 0.6% of the surface; headings #000 / #211922; secondary buttons #E5E5E0.

### One typeface, contrast through weight
- **Trigger**: When type must sit next to busy, colourful imagery.
- **Decision**: Chose a single sans in four weights over a display + body pairing.
- **Reason**: A characterful display face would fight the photos; big weight jumps give hierarchy without adding a second voice.
- **Evidence**: 1 family across 683/683 elements; 48px/900 at -0.5px tracking vs 16px/400 body; nav and tabs 16px/500.
