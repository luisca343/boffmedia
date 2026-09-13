# Changelog fragments

Add one YAML file per user-facing change. English is required; Spanish is
optional while the release is being prepared. If Spanish is present, both
`title.es` and `description.es` must be present.

```yaml
id: mhwilds-wishlist-2026-09-13
type: improvement
title:
  en: Wishlist improvements
  es: Mejoras en la lista de deseos
description:
  en: The wishlist now keeps item variants grouped together.
  es: La lista de deseos agrupa ahora las variantes.
```

Allowed types are `new`, `improvement`, `fix`, `security`, `deprecated`, and
`removed`.

Fragments are claimed by release automation and consumed when the release is
published. A draft that is abandoned can be archived from the release admin;
its claimed fragments become `released` and are eligible for a later release.
Do not reuse an existing `id`, edit a claimed fragment in place, or delete a
fragment to make it disappear from a release; create a correction fragment
instead.
