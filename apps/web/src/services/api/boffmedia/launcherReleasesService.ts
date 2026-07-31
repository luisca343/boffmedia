import type { LauncherReleaseEntity } from "@boffmedia/shared"

import {
  apiAuthedAutoBinaryPOST,
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
} from "@/services/http/boff-client"

export type LauncherTarget =
  | "windows-x86_64"
  | "linux-x86_64"
  | "darwin-x86_64"
  | "darwin-aarch64"

export type UploadLauncherReleaseInput = {
  version: string
  target: LauncherTarget
  notes?: string
}

export class LauncherReleasesService {
  static list() {
    return apiAuthedAutoGET<LauncherReleaseEntity[]>("/launcher/admin/releases")
  }

  static upload(
    input: UploadLauncherReleaseInput,
    artifact: File,
    signature: string,
  ) {
    const params = new URLSearchParams({
      version: input.version,
      target: input.target,
    })
    if (input.notes?.trim()) params.set("notes", input.notes.trim())

    return apiAuthedAutoBinaryPOST<LauncherReleaseEntity>(
      `/launcher/admin/releases?${params.toString()}`,
      artifact,
      {
        "X-Updater-Signature": signature,
        "X-Artifact-Filename": artifact.name,
      },
    )
  }

  static publish(id: number) {
    return apiAuthedAutoPOST<LauncherReleaseEntity>(
      `/launcher/admin/releases/${id}/publish`,
      {},
    )
  }

  static unpublish(id: number) {
    return apiAuthedAutoPOST<LauncherReleaseEntity>(
      `/launcher/admin/releases/${id}/unpublish`,
      {},
    )
  }
}
