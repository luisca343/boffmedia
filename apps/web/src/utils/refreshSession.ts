import { getSession } from 'next-auth/react'

export async function forceSessionRefresh() {
  try {
    // Force NextAuth to refresh the session by calling update
    const event = new Event('visibilitychange')
    document.dispatchEvent(event)
    
    // Get fresh session data
    const session = await getSession()
    
    // Trigger a page refresh to ensure all components get updated data
    window.location.reload()
    
    return session
  } catch (error) {
    console.error('Error refreshing session:', error)
    throw error
  }
}