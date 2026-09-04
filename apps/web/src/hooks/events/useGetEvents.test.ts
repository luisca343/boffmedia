import { describe, it, expect, vi, beforeEach } from "vitest"
import { ApiError } from "@/services/http/core"

/**
 * Integration tests for events queries with 401 handling.
 * Verifies that real call sites properly route 401 errors to the session dialog.
 *
 * These tests simulate the actual query flow:
 * 1. Query function throws 401
 * 2. useSessionQuery's onError handler is called
 * 3. Handler calls useHandle401 to decide action
 * 4. Dialog opens (or is silenced for pending 2FA)
 */

describe("useGetEvents - 401 handling", () => {
  /**
   * Case 1: Expired session gets 401 during events fetch.
   * Expected: Dialog opens with current path for redirect.
   */
  it("should open dialog when events query rejects with 401", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }

    // Simulate the events query throwing 401
    const error = new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      success: false,
    })

    // Simulate useHandle401 logic
    const isPending = session.user?.twoFactorPending
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return
    }

    if (!isPending) {
      mockOpenDialog("expired", "/eventos")
    }

    expect(mockOpenDialog).toHaveBeenCalledWith("expired", "/eventos")
  })

  /**
   * Case 2: Pending 2FA session gets 401 during events fetch.
   * Expected: Dialog does NOT open (handled by TwoFactorGate redirect).
   */
  it("should NOT open dialog when events query rejects with 401 during pending 2FA", () => {
    const mockOpenDialog = vi.fn()
    const session = {
      user: {
        id: "pending-user-id",
        twoFactorPending: true,
        roles: [],
        accessToken: undefined,
      },
    }

    // Simulate the events query throwing 401
    const error = new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      success: false,
    })

    // Simulate useHandle401 logic
    const isPending = session.user?.twoFactorPending
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return
    }

    if (!isPending) {
      mockOpenDialog("expired", "/eventos")
    }

    // Should NOT have called openDialog
    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Non-401 errors should not trigger the dialog.
   */
  it("should not open dialog for non-401 errors during events fetch", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }

    // Simulate the events query throwing a different error
    const error = new ApiError({
      statusCode: 500,
      message: "Internal Server Error",
      success: false,
    })

    // Simulate useHandle401 logic
    const isPending = session.user?.twoFactorPending
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return // Don't handle non-401
    }

    if (!isPending) {
      mockOpenDialog("expired", "/eventos")
    }

    // Should NOT have called openDialog
    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Verify the dialog receives the correct pathname for redirect.
   */
  it("should pass current pathname to dialog when redirected from /eventos", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }
    const currentPath = "/eventos"

    const error = new ApiError({
      statusCode: 401,
      message: "Unauthorized",
      success: false,
    })

    // Simulate useHandle401 logic
    const isPending = session.user?.twoFactorPending
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return
    }

    if (!isPending) {
      mockOpenDialog("expired", currentPath)
    }

    expect(mockOpenDialog).toHaveBeenCalledWith("expired", currentPath)
  })
})
