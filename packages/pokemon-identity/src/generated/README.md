# Generated modules

This directory will contain the generated Pokemon identity mapping table when `scripts/tools/pokemon-identity-report.mjs` runs.

Until then, this placeholder is here.

The generated module will contain:
- `toPixelmonForm()` — map Showdown species ID → Pixelmon (dex, form)
- `toShowdownId()` — map Pixelmon (dex, form) → Showdown species ID
- `toShowdownMove()` — map Pixelmon move name → Showdown move ID
- `toShowdownAbility()` — map Pixelmon ability slug → Showdown ability ID

All with full `Resolved<T>` results carrying `OverrideKind` info.
