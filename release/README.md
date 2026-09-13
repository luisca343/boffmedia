# Release metadata

`version.json` is the canonical product version. Update it in the release
preparation change, together with the synchronized desktop copies checked by
`scripts/release-notes.mjs`.

`plan.json` declares which production surfaces must be verified before the
release can publish its public changelog. The allowed values are `web`, `api`,
and `desktop`; use only the surfaces that are part of that release.

Production workflows read both files, scan `changelog/fragments/`, create a
fragment-backed draft, and record a deployment only after the live artifact
passes its identity and health probe. The API publishes automatically when the
draft is approved and every required surface has a verified production
deployment.

An admin can archive an incorrect draft before publication. This releases its
claimed fragments without exposing the draft publicly. A published rollback is
handled separately as a withdrawal, so the historical changelog remains
visible with its withdrawal notice.
