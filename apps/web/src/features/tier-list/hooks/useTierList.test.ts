// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useTierList } from "./useTierList"
import { fixture } from "../testing/fixtures"
import type { TierListDocument } from "../core/schema"
afterEach(cleanup)

describe("autosave failure and ordering", () => {
  it("keeps edited state on quota failure and saves it on retry", async () => {
    const initial = fixture()
    const driver = { load: vi.fn(async () => initial), save: vi.fn(async (_doc: TierListDocument): Promise<void> => { throw new Error("quota") }), delete: vi.fn(async () => {}) }
    const { result } = renderHook(() => useTierList(initial, driver))
    await waitFor(() => expect(result.current.loaded).toBe(true))
    act(() => result.current.dispatch({ type: "assign", itemId: "one", rowId: "s" }))
    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.document.instance.placements.s[0].itemId).toBe("one")
    driver.save.mockImplementation(async () => {})
    act(() => result.current.retrySave())
    await waitFor(() => expect(result.current.status).toBe("saved"))
    expect(driver.save.mock.lastCall?.[0].instance.placements.s[0].itemId).toBe("one")
  })
  it("does not overwrite a document when loading fails", async () => {
    const driver = { load: vi.fn(async () => { throw new Error("corrupt") }), save: vi.fn(async (_doc: TierListDocument) => {}), delete: vi.fn(async () => {}) }
    const { result } = renderHook(() => useTierList(fixture(), driver))
    await waitFor(() => expect(result.current.loadFailed).toBe(true))
    act(() => result.current.dispatch({ type: "assign", itemId: "one", rowId: "s" }))
    expect(driver.save).not.toHaveBeenCalled()
    await act(async () => result.current.recoverLocal())
    await waitFor(() => expect(result.current.status).toBe("saved"))
    expect(driver.delete).toHaveBeenCalledOnce()
  })
  it("serializes asynchronous saves so an older commit cannot overwrite a newer one", async () => {
    const initial = fixture(), saved: string[] = []
    let completeFirst: (() => void) | undefined
    const driver = { load: async () => initial, delete: async () => {}, save: vi.fn(async (doc: TierListDocument) => {
      if (!saved.length) await new Promise<void>((resolve) => { completeFirst = resolve })
      saved.push(Object.values(doc.instance.placements).flat().map((p) => p.itemId).join(","))
    }) }
    const { result } = renderHook(() => useTierList(initial, driver))
    await waitFor(() => expect(result.current.loaded).toBe(true))
    act(() => result.current.dispatch({ type: "assign", itemId: "one", rowId: "s" }))
    await waitFor(() => expect(completeFirst).toBeDefined())
    act(() => result.current.dispatch({ type: "assign", itemId: "two", rowId: "s" }))
    await act(async () => completeFirst?.())
    await waitFor(() => expect(result.current.status).toBe("saved"))
    expect(saved).toEqual(["one", "one,two"])
  })
  it("persists undo even when it returns to the loaded state before a save completes", async () => {
    const initial = fixture(), saved: TierListDocument[] = []
    let completeFirst: (() => void) | undefined
    const driver = { load: async () => initial, delete: async () => {}, save: vi.fn(async (doc: TierListDocument) => {
      if (!saved.length) await new Promise<void>((resolve) => { completeFirst = resolve })
      saved.push(doc)
    }) }
    const { result } = renderHook(() => useTierList(initial, driver))
    await waitFor(() => expect(result.current.loaded).toBe(true))
    act(() => result.current.dispatch({ type: "assign", itemId: "one", rowId: "s" }))
    await waitFor(() => expect(completeFirst).toBeDefined())
    act(() => result.current.dispatch({ type: "undo" }))
    expect(result.current.document).toEqual(initial)
    await act(async () => completeFirst?.())
    await waitFor(() => expect(result.current.status).toBe("saved"))
    expect(saved.at(-1)).toEqual(initial)
    expect(saved).toHaveLength(2)
  })
})
