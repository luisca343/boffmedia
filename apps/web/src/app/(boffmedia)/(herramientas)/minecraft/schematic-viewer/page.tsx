import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SchematicViewerTool } from "@boffmedia/tools-minecraft";

// See the compat route: `--nav-h` is host chrome, so the box is the host's job.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("schematicViewer.title"), description: t("schematicViewer.description") }
}

export default function SchematicViewerPage() {
  return (
    <div style={{ height: "calc(100dvh - var(--nav-h))" }}>
      <SchematicViewerTool />
    </div>
  );
}
