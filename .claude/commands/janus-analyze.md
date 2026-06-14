---
description: Deep-scan the project and author the architecture brief + config
---

Run the janus deep-scan so this repo gets project-tailored context.

1. Run `janus analyze` to get the deterministic signal brief.
2. Explore the codebase as the brief directs — entry points, modules, tests, config.
3. Author `.janus/architecture.md` (replace every placeholder; remove the stub note).
4. Populate `.janus/config.json`: `context.groups`, `structural.rules`, `verification.stages`.
5. Refine `.janus/constitution.md` and add `.janus/guidelines/<area>.md` files as needed.
6. Run `janus analyze mark` to record the analysis baseline.

Report what you authored and anything the user should review.
