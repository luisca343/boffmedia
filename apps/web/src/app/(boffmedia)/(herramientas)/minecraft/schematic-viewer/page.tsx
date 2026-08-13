import { SchematicViewerTool } from "@boffmedia/tools-minecraft";

// See the compat route: `--nav-h` is host chrome, so the box is the host's job.
export default function SchematicViewerPage() {
  return (
    <div style={{ height: "calc(100dvh - var(--nav-h))" }}>
      <SchematicViewerTool />
    </div>
  );
}
