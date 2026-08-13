import { SchematicCompatTool } from "@boffmedia/tools-minecraft";

// The tool fills its parent; the viewport math lives HERE because `--nav-h` is
// an apps/web concept (globals.css). Keeping it in the package made the shell
// collapse in every host that does not define that variable.
export default function SchematicCompatPage() {
  return (
    <div style={{ height: "calc(100dvh - var(--nav-h))" }}>
      <SchematicCompatTool />
    </div>
  );
}
