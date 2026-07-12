import type { ReactNode } from "react";
import { NotesThemeProvider } from "./_hooks/useNotesTheme";

export default function NotesLayout({ children }: { children: ReactNode }) {
  return <NotesThemeProvider>{children}</NotesThemeProvider>;
}
