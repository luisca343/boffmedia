// This group's pages render on the plain v3 surface (`bg-base`, from the
// (boffmedia) layout) with no `FloatingSection` chrome. Pages still on v2
// (juegos, sugerir) render without the decorative blobs until they move over.
export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
