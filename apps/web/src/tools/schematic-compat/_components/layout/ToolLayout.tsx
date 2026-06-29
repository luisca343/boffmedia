import type { ReactNode } from "react";

interface ToolLayoutProps {
  setupPanel: ReactNode;
  diffPanel: ReactNode;
  previewPanel: ReactNode;
  exportBar?: ReactNode;
}

export function ToolLayout({ setupPanel, diffPanel, previewPanel, exportBar }: ToolLayoutProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Setup — fixed width left column */}
        <aside className="w-60 shrink-0 border-r border-border overflow-y-auto">
          {setupPanel}
        </aside>

        {/* Diff — flexible center column */}
        <main className="flex-1 min-w-0 overflow-y-auto border-r border-border">
          {diffPanel}
        </main>

        {/* Preview — fixed width right column */}
        <aside className="w-96 shrink-0 overflow-hidden">
          {previewPanel}
        </aside>
      </div>

      {exportBar && (
        <footer className="shrink-0 border-t border-border">
          {exportBar}
        </footer>
      )}
    </div>
  );
}
