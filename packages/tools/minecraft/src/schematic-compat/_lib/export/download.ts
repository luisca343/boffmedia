import { saveFile, type SaveFileResult } from "@boffmedia/tool-kit";

/**
 * Hand a generated file to the host's save flow.
 *
 * The Blob is passed through as-is rather than buffered here: the launcher's
 * implementation calls `.stream()` on it and writes to disk in chunks, which is
 * what keeps a multi-GB `.prefab` export off the Tauri IPC boundary. On the web
 * this still resolves to the same anchor-click download as before.
 */
export function triggerDownload(blob: Blob, filename: string): Promise<SaveFileResult> {
  const extension = filename.split(".").pop();
  return saveFile({
    suggestedName: filename,
    data: blob,
    mimeType: blob.type || undefined,
    filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
  });
}
