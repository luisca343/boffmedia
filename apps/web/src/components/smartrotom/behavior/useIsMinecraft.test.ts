// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { useIsMinecraft } from './useIsMinecraft'

describe('useIsMinecraft', () => {
  const originalMcefQuery = window.mcefQuery

  afterEach(() => {
    // Restore original state
    Object.defineProperty(window, 'mcefQuery', {
      configurable: true,
      writable: true,
      value: originalMcefQuery,
    })
  })

  it('returns false during SSR / hydration', () => {
    const { result } = renderHook(() => useIsMinecraft())
    expect(result.current).toBe(false)
  })

  it('returns false when mcefQuery is not available', () => {
    Object.defineProperty(window, 'mcefQuery', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useIsMinecraft())
    // Initially false
    expect(result.current).toBe(false)
  })

  it('returns true when mcefQuery is available after mount', () => {
    // Mock mcefQuery
    Object.defineProperty(window, 'mcefQuery', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })

    const { result } = renderHook(() => useIsMinecraft())
    // After mount, should detect mcefQuery
    // Note: This test depends on useEffect timing
    expect(result.current).toBe(true)
  })
})
