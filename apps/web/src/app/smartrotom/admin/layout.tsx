import type { ReactNode } from "react"
import AdminShell from "./_components/AdminShell"
import "./terminal.css"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
