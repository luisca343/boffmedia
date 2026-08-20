import type { DesktopDownloadEntity } from "@boffmedia/shared"

import { boffGET } from "@/services/http/boff-client"

/** Público: no lleva token. La página de descargas se ve sin iniciar sesión. */
export class DesktopDownloadsService {
  static list() {
    return boffGET<DesktopDownloadEntity[]>("/desktop/downloads")
  }
}
