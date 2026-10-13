// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { useClassPlan } from "./useClassPlan"

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks() })

describe("Saved class plans", () => {
  it("restores after remount and isolates accounts", async () => {
    const first = renderHook(({ account }) => useClassPlan(account), { initialProps: { account: "one" } })
    await waitFor(() => expect(first.result.current.ready).toBe(true))
    act(() => first.result.current.assignClass("cai", "cai", "shido"))
    first.unmount()
    const next = renderHook(({ account }) => useClassPlan(account), { initialProps: { account: "one" } })
    expect(next.result.current.plan.cai.cai).toBe("shido")
    next.rerender({ account: "two" })
    expect(next.result.current.plan.cai.cai).toBeUndefined()
    act(() => next.result.current.assignClass("cai", "cai", "dancer"))
    next.rerender({ account: "one" })
    expect(next.result.current.plan.cai.cai).toBe("shido")
    expect(JSON.parse(localStorage.getItem("boffmedia:fortunes-weave:classes:v1:two")!).cai.cai).toBe("dancer")
  })

  it("keeps working when browser storage fails and reports the limitation", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked") })
    const { result } = renderHook(() => useClassPlan("blocked"))
    act(() => result.current.assignClass("leda", "leda", "dancer"))
    expect(result.current.plan.leda.leda).toBe("dancer")
    expect(result.current.storageAvailable).toBe(false)
  })
})
