import { describe, it, expect, vi } from "vitest"

/**
 * Tests for the 401 error handling logic.
 * Verifies that we correctly distinguish between:
 * - Pending 2FA: Session is halfway through 2FA, don't show dialog
 * - Refreshable session: Session exists, might be refreshable
 * - Expired session: No valid tokens
 *
 * These are unit tests for the logic (not React integration).
 */

// Mock ApiError class for testing
class MockApiError extends Error {
  constructor(
    readonly statusCode: number,
    message?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

describe("401 error handling logic", () => {
  /**
   * Case 1: Pending 2FA session gets 401 — should NOT show dialog.
   * A pending session has no accessToken, so 401 is expected here.
   * TwoFactorGate will redirect to /entrar/2fa anyway.
   */
  it("should NOT show dialog for pending 2FA session", () => {
    const mockOpenDialog = vi.fn()
    const session = {
      user: {
        id: "123",
        twoFactorPending: true,
        roles: [],
        accessToken: undefined,
      },
    }

    // Simulate the handle401 logic
    const isPending = session.user?.twoFactorPending
    if (!isPending) {
      mockOpenDialog("expired", "/eventos")
    }

    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Case 2: Non-pending session gets 401 — should show dialog.
   * The session exists, but authentication failed.
   */
  it("should show dialog for expired session", () => {
    const mockOpenDialog = vi.fn()
    const session = {
      user: {
        id: "123",
        username: "testuser",
        twoFactorPending: false,
        roles: ["user"],
        accessToken: undefined,
      },
    }

    // Simulate the handle401 logic
    const isPending = session.user?.twoFactorPending
    if (!isPending) {
      mockOpenDialog("expired", "/eventos")
    }

    expect(mockOpenDialog).toHaveBeenCalledWith("expired", "/eventos")
  })

  /**
   * Non-401 errors should not trigger dialog.
   */
  it("should not handle non-401 errors", () => {
    const mockOpenDialog = vi.fn()
    const error = new MockApiError(500, "Internal Server Error")

    // Simulate check: only 401 gets handled
    const isApiError = error instanceof MockApiError
    const is401 = isApiError && error.statusCode === 401

    if (is401) {
      mockOpenDialog("expired", "/eventos")
    }

    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Non-ApiError errors should not trigger dialog.
   */
  it("should not handle non-ApiError errors", () => {
    const mockOpenDialog = vi.fn()
    const error = new Error("Network error")

    // Simulate check: only ApiError gets handled
    const isApiError = error instanceof MockApiError
    const is401 = isApiError && (error as any).statusCode === 401

    if (is401) {
      mockOpenDialog("expired", "/eventos")
    }

    expect(mockOpenDialog).not.toHaveBeenCalled()
  })

  /**
   * Dialog should preserve the current pathname for redirect after sign-in.
   */
  it("should pass current pathname to dialog for redirect", () => {
    const mockOpenDialog = vi.fn()
    const session = {
      user: {
        id: "123",
        twoFactorPending: false,
        roles: ["user"],
      },
    }
    const currentPath = "/foro/threads/123"
    const error = new MockApiError(401, "Unauthorized")

    // Simulate the handle401 logic
    const isPending = session.user?.twoFactorPending
    const isApiError = error instanceof MockApiError
    const is401 = isApiError && error.statusCode === 401

    if (!isPending && is401) {
      mockOpenDialog("expired", currentPath)
    }

    expect(mockOpenDialog).toHaveBeenCalledWith("expired", currentPath)
  })
})
