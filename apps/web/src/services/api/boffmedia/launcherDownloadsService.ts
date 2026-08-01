import type { LauncherDownloadEntity } from "@boffmedia/shared"

import { boffGET } from "@/services/http/boff-client"

/** Público: no lleva token. La página de descargas se ve sin iniciar sesión. */
export class LauncherDownloadsService {
  static list() {
    return boffGET<LauncherDownloadEntity[]>("/launcher/downloads")
  }
}
