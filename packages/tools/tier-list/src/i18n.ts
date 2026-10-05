import { useMemo } from "react"
import { useRootT, type Translate } from "@boffmedia/ui/i18n"

export function useTierListT(namespace = "tierLists"): Translate {
  const root = useRootT()
  return useMemo(() => (key: string, values?: Record<string, string | number | Date>) =>
    root(`${namespace}.${key}`, values), [root, namespace])
}
