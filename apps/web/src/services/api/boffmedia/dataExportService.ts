import { apiAuthedAutoGET, apiAuthedAutoPOST, getApiUrl, sessionToken } from '@/services/boffAPI'

/**
 * State of a GDPR data-export request.
 *
 * Hand-written rather than imported from `@boffmedia/shared`: that package is
 * regenerated from the live API's OpenAPI document, so a type for an endpoint
 * that has not been deployed yet does not exist there.
 */
export interface DataExportStatus {
  id: number
  status: 'pending' | 'ready' | 'failed' | 'expired'
  requestedAt: string
  completedAt: string | null
  expiresAt: string | null
  sizeBytes: number | null
}

export class DataExportService {
  /** Ask for a copy of everything the site holds on you. Returns the row to poll. */
  static request() {
    return apiAuthedAutoPOST<DataExportStatus>('/users/me/data-export', {})
  }

  /** Your most recent request, or `null` if you have never made one. */
  static status() {
    return apiAuthedAutoGET<DataExportStatus | null>('/users/me/data-export')
  }

  /**
   * Save a prepared archive to disk.
   *
   * A plain link cannot do this: the route is Bearer-authenticated and the
   * browser sends no Authorization header when it navigates. So the file is
   * fetched as a blob and handed to an object URL — which also means the token
   * never ends up in a URL, a referrer or a history entry.
   */
  static async download(exportId: number): Promise<void> {
    const res = await fetch(`${getApiUrl()}/users/me/data-export/${exportId}/download`, {
      headers: { Authorization: `Bearer ${await sessionToken()}` },
    })
    if (!res.ok) throw new Error(`Export download failed (${res.status})`)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filenameFrom(res) ?? `boffmedia-datos-${exportId}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }
}

/** The server names the file; this only reads the name back off the header. */
function filenameFrom(res: Response): string | null {
  const disposition = res.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="([^"]+)"/)
  return match?.[1] ?? null
}
