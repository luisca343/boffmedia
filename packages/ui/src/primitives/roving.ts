import * as React from "react"

/** The ARIA radio-group keyboard contract, which `RadioGroup` and a single-choice
 *  `OptionGroup` both declared (`role="radiogroup"`) without ever implementing:
 *  arrow keys move between options and select as they go, and only one option is
 *  in the tab order, so Tab enters and leaves the group rather than walking every
 *  choice in it.
 *
 *  Not used for a multi-select group — a set of checkboxes keeps every option
 *  tabbable and has no arrow-key behaviour to implement. */
export function useRoving(count: number, isOn: (i: number) => boolean, isDisabled: (i: number) => boolean) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  // Cached per index: a callback ref with a fresh identity every render is
  // detached and re-attached on every render.
  const cbs = React.useRef<((el: HTMLButtonElement | null) => void)[]>([])
  const setRef = (i: number) => (cbs.current[i] ||= (el: HTMLButtonElement | null) => void (refs.current[i] = el))

  // The checked option holds the tab stop. With nothing checked yet the group
  // must still be reachable, so the first enabled option takes it instead.
  let stop = -1
  for (let i = 0; i < count; i++) if (isOn(i) && !isDisabled(i)) stop = i
  if (stop < 0) for (let i = 0; i < count && stop < 0; i++) if (!isDisabled(i)) stop = i

  const onKeyDown = (e: React.KeyboardEvent, i: number, pick: (i: number) => void) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    // Wrap around, skipping disabled options. Bounded by `count` so a group whose
    // options are all disabled stops instead of spinning.
    let next = i
    for (let n = 0; n < count; n++) {
      next = (next + step + count) % count
      if (!isDisabled(next)) break
    }
    if (next === i) return
    refs.current[next]?.focus()
    pick(next)
  }

  return { setRef, tabIndex: (i: number) => (i === stop ? 0 : -1), onKeyDown }
}
