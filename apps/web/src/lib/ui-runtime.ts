import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import { configureUi } from "@boffmedia/ui"

// Runs at import time, once per module graph. Next builds the server and the
// client bundles separately, so this module has to be reachable from BOTH —
// see `UiRuntime` in the root layout, which is a client component, and the
// layout module itself, which is not. Registering the hooks (not their
// results) keeps per-request locale resolution intact.
configureUi({
  useTranslate: () => useTranslations("common.primitives"),
  useLocale,
  Link,
})
