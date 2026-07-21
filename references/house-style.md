# House visual style: editorial paper-collage

Default visual style unless the user explicitly requests another. Applies to both planning (`storyboard-director`) and the image-generation prompt (`master-prompt-template.md`'s `{STYLE_AND_CONTINUITY_RULES}`). Derived from the two reference productions in `.local-videos/ursidae-mastercanvas-layered` and `.local-videos/viral-online-v2-layered`, which set the visual bar for this plugin.

- Treat any supplied reference image as inspiration for visual language only. Never reproduce its exact layout, characters, objects, wording, typeface, palette, or decorative placements.
- Warm editorial paper-collage illustration: hand-cut paper shapes with crisp dark ink contours, tactile layered depth, subtle print grain. Sophisticated and educational, not childish or corporate.
- Cream or warm parchment background as the base plate.
- **Palette formula:** cream/parchment base + one dark ink color (near-black, not pure black) + one warm accent + one cool accent, chosen per topic. Reference values that work well: cream `#FFF3D5`, ink `#172234`, warm accent burnt orange `#EF6C26`, cool accent cobalt `#184D9C`. For nature/field-guide topics, a fuller earth palette also works: parchment, deep forest green, rust brown, glacier blue, charcoal (see the ursidae project). Pick the two accents to fit the topic; keep the cream base and dark ink constant.
- Recognizable, coherent-scale subjects with clean silhouettes; soft directional lighting; no photorealism, no 3D rendering, no glossy UI, no gradients, no saturated multicolor palettes, no stock-photo elements, no dense chaotic backgrounds, no heavy soft shadows.
- Keep every named recurring character or object identical across slides: proportions, palette, contour weight, drawing language.
- Use generous negative space, one clear visual path per slide, and a distinct composition per scene — never repeat the same arrangement of title, subject, and diagram in multiple panels.
- Generated artwork provides environments, characters, and objects. Exact titles, labels, numbers, arrows, cards, and diagrams are added afterward as deterministic overlays — the artwork must leave the declared overlay zones quiet and empty, with no embedded lettering of any kind.

## Overlay typography

Overlay text renders in a clean editorial sans (Inter or equivalent), not handwritten. Title, label, definition, value, and takeaway roles use weight and size to establish hierarchy; the warm accent color is reserved for emphasis (key phrases, outcomes, active caption word), never for body copy. See `overlay-storyboard.md` for the `theme` block — it defaults to this palette and font; only override it when the user requests a different visual direction.

## Cutout tray (optional, recommended when scenes share characters/objects)

When the same character or object appears across multiple scenes, generate it once as a foreground cutout in the same image-generation call as the storyboard sheet, not redrawn per scene. Add one horizontal tray of cutout cells below the scene grid, each cell a flat solid chroma-key background (`#FF00FF` magenta or `#00ff00` green — pick whichever contrasts most with the palette in use) containing one full-body subject: generous padding, no shadow, no ground plane, no scenery, matching the exact drawing language, palette, and proportions used in the scene panels. Extract and key each cell to a transparent PNG under `public/overlays/` (see `overlay-storyboard.md` § Cutout extraction) and layer it into scenes with `zIndex` so it can pass in front of or behind deterministic overlays.
