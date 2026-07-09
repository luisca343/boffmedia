import { apiAuthedAutoPOST } from '@/services/boffAPI'

export interface CreateSuggestionPayload {
  title: string
  gameName: string
  type: string
  description: string
  additionalInfo?: string
  suggestedDate?: string
  endDate?: string
  maxParticipants?: number
}

/** Hand-written (no generate:shared needed). Mirrors the NestJS suggestions controller. */
export class SuggestionsService {
  /** Submit an event suggestion. Requires an authenticated session. */
  static create(data: CreateSuggestionPayload) {
    return apiAuthedAutoPOST<{ success: boolean; id: number }>(
      '/events/suggestions',
      data,
    )
  }
}
