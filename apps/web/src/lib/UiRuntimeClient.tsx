"use client"

// The client half of the registration. `ui-runtime` has no "use client" of its
// own, so importing it from here is what pulls it into the client bundle and
// runs configureUi() there too. Renders nothing; it exists for the import.
//
// Deliberately hook-free: this is mounted in the ROOT layout, outside
// `SessionProvider`, so anything reading the session belongs in
// `ToolSessionBridge` instead.
import "./ui-runtime"

export function UiRuntimeClient() {
  return null
}
