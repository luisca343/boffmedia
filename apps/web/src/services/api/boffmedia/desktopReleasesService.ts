import type { DesktopReleaseEntity } from "@boffmedia/shared"

import {
  apiAuthedAutoBinaryPOST,
  apiAuthedAutoGET,
  apiAuthedAutoPOSTWithHeaders,
} from "@/services/http/boff-client"
import { STEP_UP_HEADER } from "@/services/api/boffmedia/stepUp"

export type DesktopTarget =
  | "windows-x86_64"
  | "linux-x86_64"
  | "darwin-x86_64"
  | "darwin-aarch64"

export type UploadDesktopReleaseInput = {
  version: string
  target: DesktopTarget
  notes?: string
}

export class DesktopReleasesService {
  static list() {
    return apiAuthedAutoGET<DesktopReleaseEntity[]>("/desktop/admin/releases")
  }

  /** Every method below takes a `stepUpToken`: uploading and publishing change
   *  what runs on someone else's machine, so the API demands a fresh two-factor
   *  confirmation on top of the admin session. */
  static upload(
    input: UploadDesktopReleaseInput,
    artifact: File,
    signature: string,
    stepUpToken: string,
  ) {
    const params = new URLSearchParams({
      version: input.version,
      target: input.target,
    })
    if (input.notes?.trim()) params.set("notes", input.notes.trim())

    return apiAuthedAutoBinaryPOST<DesktopReleaseEntity>(
      `/desktop/admin/releases?${params.toString()}`,
      artifact,
      {
        "X-Updater-Signature": signature,
        "X-Artifact-Filename": artifact.name,
        [STEP_UP_HEADER]: stepUpToken,
      },
    )
  }

  static publish(id: number, stepUpToken: string) {
    return apiAuthedAutoPOSTWithHeaders<DesktopReleaseEntity>(
      `/desktop/admin/releases/${id}/publish`,
      {},
      { [STEP_UP_HEADER]: stepUpToken },
    )
  }

  static unpublish(id: number, stepUpToken: string) {
    return apiAuthedAutoPOSTWithHeaders<DesktopReleaseEntity>(
      `/desktop/admin/releases/${id}/unpublish`,
      {},
      { [STEP_UP_HEADER]: stepUpToken },
    )
  }
}
