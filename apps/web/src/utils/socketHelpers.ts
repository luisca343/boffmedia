import { Session } from "next-auth"

export const update = async (updates: Partial<Session['user']>) => {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })

    if (!res.ok) {
      throw new Error('Failed to update session')
    }

    // Optionally, you can return the updated session data
    return await res.json()
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}
