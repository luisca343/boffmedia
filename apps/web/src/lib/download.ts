/**
 * Download a text file to the user's device.
 * @param filename - The name of the file to save
 * @param text - The text content to save
 * @param mime - The MIME type (default: "text/plain")
 */
export function downloadText(filename: string, text: string, mime = "text/plain"): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
