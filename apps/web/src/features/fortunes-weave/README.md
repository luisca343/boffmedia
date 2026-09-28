# Fortune’s Weave portraits

`public/boffmedia/img/games/fortunes-weave/portraits/<character-id>.webp` contains the artwork
for `/tier-lists/fire-emblem-fortunes-weave`. Character IDs and URLs are defined once in
`apps/web/src/features/fortunes-weave/characters.ts`, using the site's static asset helper.
The real asset tree lives in root `public/`; `apps/web/public` is its junction.
All of `public/` stays ignored, matching the existing asset workflow. Do not add ignore
exceptions or force-add assets. Keep documentation in source alongside the collection.

Source: [Polygon's recruitable-character guide](https://www.polygon.com/fire-emblem-fortunes-weave-recruitable-characters-all-support-level/).
Artwork is game imagery credited by that guide to Intelligent Systems / Nintendo via Polygon.
The original 46 WebP portraits were moved unchanged from the recruitment route's source assets.
Only pre-timeskip artwork is used for the lords. The earlier Dietrich, Theodora and Leda
portrait files from Polygon were downloaded on 2026-09-28 and encoded as WebP at quality
90 without changing their crop or dimensions. Cai is cropped from Polygon's opening-game
hero montage (550×550 at x=1370, y=510), then resized to 226×226. Its source is the
[hero-selection guide linked by the recruitment page](https://www.polygon.com/fire-emblem-fortunes-weave-heroes-change-route-how-to/).
The lord filenames end in `-pre-timeskip.webp`, so image caches cannot reuse the previously
selected later artwork. The old four lord files have been removed.

| Character | Source image |
| --- | --- |
| Cai | [Opening-game hero montage](https://static0.polygonimages.com/wordpress/wp-content/uploads/2026/09/fefortunesweave_guide_heroes_lead.jpg) |
| Dietrich | [fefw2_0002_dietrich.jpg](https://static0.polygonimages.com/wordpress/wp-content/uploads/2026/09/fefw2_0002_dietrich.jpg?q=70&fit=crop&w=226&dpr=1) |
| Leda | [fefw_0027_leda.jpg](https://static0.polygonimages.com/wordpress/wp-content/uploads/2026/09/fefw_0027_leda.jpg?q=70&fit=crop&w=226&dpr=1) |
| Theodora | [fefw2_0000_theodora.jpg](https://static0.polygonimages.com/wordpress/wp-content/uploads/2026/09/fefw2_0000_theodora.jpg?q=70&fit=crop&w=226&dpr=1) |

Runtime pages and PNG export use these locally served assets, without hotlinking Polygon.
This collection contains the existing 50 characters and does not add the guide's separate
spoiler-only recruits. The tier-list preset has no runtime or test dependency on the dedicated
recruitment page. This feature is developed on the `tierlist` branch.
