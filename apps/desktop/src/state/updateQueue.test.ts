import { updateQueueReducer, initialUpdateQueueState, isUpdateQueueActive, updateQueueCount } from "./updateQueue"

describe("updateQueue", () => {
  it("enqueues packs in order", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    expect(state.queued).toEqual(["a", "b", "c"])
    expect(state.current).toBeNull()
  })

  it("prevents duplicate enqueueing", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b"] })
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["b", "c"] })
    // 'b' should not be duplicated
    expect(state.queued).toContain("a")
    expect(state.queued).toContain("b")
    expect(state.queued).toContain("c")
    const bCount = state.queued.filter((id) => id === "b").length
    expect(bCount).toBe(1)
  })

  it("starts the first pack when queue/start is dispatched", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    expect(state.current).toBe("a")
    expect(state.queued).toEqual(["b", "c"])
  })

  it("progresses to next pack when current finishes", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/done" })
    expect(state.current).toBe("b")
    expect(state.queued).toEqual(["c"])
  })

  it("becomes idle when queue is empty after done", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/done" })
    expect(state.current).toBeNull()
    expect(state.queued).toEqual([])
  })

  it("stops the queue (sets stopping flag)", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/stop" })
    expect(state.stopping).toBe(true)
    expect(state.current).toBe("a")
  })

  it("clears stopping flag on queue/done after stop", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/stop" })
    state = updateQueueReducer(state, { type: "queue/done" })
    expect(state.stopping).toBe(false)
  })

  it("clears the entire queue on queue/clear", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/clear" })
    expect(state.current).toBeNull()
    expect(state.queued).toEqual([])
    expect(state.stopping).toBe(false)
  })

  it("reports queue active when there are queued items", () => {
    let state = initialUpdateQueueState
    expect(isUpdateQueueActive(state)).toBe(false)
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a"] })
    expect(isUpdateQueueActive(state)).toBe(true)
  })

  it("reports queue active when current item is running", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    expect(isUpdateQueueActive(state)).toBe(true)
  })

  it("counts queued and current packs", () => {
    let state = initialUpdateQueueState
    expect(updateQueueCount(state)).toBe(0)
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b", "c"] })
    expect(updateQueueCount(state)).toBe(3)
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    expect(updateQueueCount(state)).toBe(3)
    state = updateQueueReducer(state, { type: "queue/done" })
    expect(updateQueueCount(state)).toBe(2)
  })

  it("handles error same as done (progresses queue)", () => {
    let state = initialUpdateQueueState
    state = updateQueueReducer(state, { type: "queue/enqueue", packIds: ["a", "b"] })
    state = updateQueueReducer(state, { type: "queue/start", packId: "a" })
    state = updateQueueReducer(state, { type: "queue/error" })
    expect(state.current).toBe("b")
    expect(state.queued).toEqual([])
  })
})
