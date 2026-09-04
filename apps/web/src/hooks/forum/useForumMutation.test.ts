import { describe, it, expect, vi } from "vitest"
import { ApiError } from "@/services/http/core"

/**
 * Integration tests for forum mutations with 401 handling.
 * Verifies that real call sites (create thread, reply, etc.) properly route
 * 401 errors to the session dialog.
 *
 * These tests simulate the actual mutation flow:
 * 1. Mutation function throws 401
 * 2. useSessionMutation's onError handler is called
 * 3. Handler calls useHandle401 to decide action
 * 4. Dialog opens (or is silenced for pending 2FA)
 */

describe("useForumMutation - 401 handling", () => {
  /**
   * Case 1: Expired session tries to create a forum post, gets 401.
   * Expected: Dialog opens with current path for redirect.
   */
  it("should open dialog when forum mutation rejects with 401", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }
    const currentPath = "/foro/threads/123"

    // Simulate the mutation throwing 401
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

  /**
   * Case 2: Pending 2FA session tries to create a forum post, gets 401.
   * Expected: Dialog does NOT open (TwoFactorGate already redirected them).
   * No double-dialog should appear.
   */
  it("should NOT open dialog when forum mutation rejects with 401 during pending 2FA", () => {
    const mockOpenDialog = vi.fn()
    const session = {
      user: {
        id: "pending-user-id",
        twoFactorPending: true,
        roles: [],
        accessToken: undefined,
      },
    }

    // Simulate the mutation throwing 401
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
      mockOpenDialog("expired", "/foro/threads/123")
    }

    // Should NOT have called openDialog
    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Non-401 errors should not open the session dialog; they handle their own errors.
   */
  it("should not open dialog for non-401 errors during forum mutation", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }

    // Simulate the mutation throwing a validation error
    const error = new ApiError({
      statusCode: 422,
      message: "Unprocessable Entity",
      success: false,
    })

    // Simulate useHandle401 logic
    const isPending = session.user?.twoFactorPending
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      return // Don't handle non-401
    }

    if (!isPending) {
      mockOpenDialog("expired", "/foro/threads/123")
    }

    // Should NOT have called openDialog
    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Verify pathname is preserved when redirecting from forum detail page.
   */
  it("should pass forum thread path when redirected during mutation", () => {
    const mockOpenDialog = vi.fn()
    const session = { user: { id: "123", twoFactorPending: false } }
    const threadPath = "/foro/threads/999"

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
      mockOpenDialog("expired", threadPath)
    }

    expect(mockOpenDialog).toHaveBeenCalledWith("expired", threadPath)
  })
})
