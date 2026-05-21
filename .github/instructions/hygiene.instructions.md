---
applyTo: "apps/**/*.ts,apps/**/*.tsx,apps/**/*.js,apps/**/*.jsx"
---
## Repository Hygiene

- Prefer canonical files over duplicate variants when implementing changes.
- Files with names like `*copy*` can exist for historical or experimental reasons; do not assume they are the active source of truth.
- Unless explicitly requested, implement feature changes in the canonical route/component/service path.
- If both canonical and copy variants exist and ownership is unclear, touch only the file referenced by the task.
