import type { DesktopReleaseEntity } from "@boffmedia/shared"

import {
  apiAuthedAutoBinaryPOST,
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
} from "@/services/http/boff-client"

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

  static upload(
    input: UploadDesktopReleaseInput,
    artifact: File,
    signature: string,
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
      },
    )
  }

  static publish(id: number) {
    return apiAuthedAutoPOST<DesktopReleaseEntity>(
      `/desktop/admin/releases/${id}/publish`,
      {},
    )
  }

  static unpublish(id: number) {
    return apiAuthedAutoPOST<DesktopReleaseEntity>(
      `/desktop/admin/releases/${id}/unpublish`,
      {},
    )
  }
}
