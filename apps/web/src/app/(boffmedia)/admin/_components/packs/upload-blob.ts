import { PacksService } from "@/services/api/boffmedia/packsService"

/** Content hash of the file as the launcher will check it. Computed here as
 *  well as server-side so an already-stored blob can be skipped without
 *  uploading it first; the server still hashes what it receives, so a mismatch
 *  is impossible to sneak past. Reads the file whole — override files are
 *  configs and scripts, not the 200 MB jars, which come from CF/Modrinth. */
export async function sha512Hex(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-512", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export type BlobUploadResult =
  | { ok: true; sha512: string; fileSize: number; reused: boolean }
  | { ok: false; message?: string }

/** Hash → skip if already stored → otherwise upload. The sha512 that comes back
 *  from the server always wins: if it disagrees with ours the file changed
 *  under us mid-upload, and referencing the local one would ship a manifest the
 *  launcher can never verify. */
export async function uploadOverrideBlob(
  // Blob, not File: entries read out of an imported .mrpack/.zip are Blobs.
  file: Blob,
  onState?: (state: "hashing" | "uploading") => void,
): Promise<BlobUploadResult> {
  onState?.("hashing")
  const local = await sha512Hex(file)

  const status = await PacksService.blobStatus(local)
  if (status.success && status.data?.present) {
    return { ok: true, sha512: local, fileSize: file.size, reused: true }
  }

  onState?.("uploading")
  const res = await PacksService.uploadBlob(file)
  if (!res.success || !res.data) return { ok: false, message: res.userMessage }
  return { ok: true, sha512: res.data.sha512, fileSize: res.data.size, reused: false }
}

export function overrideFileEntry(path: string, sha512: string, fileSize: number) {
  return {
    path,
    sha512,
    fileSize,
    source: { kind: "override" as const, blobSha512: sha512 },
  }
}
