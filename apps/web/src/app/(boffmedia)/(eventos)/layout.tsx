// v3 migration: this group's pages now render on the plain v3 surface
// (`bg-base` from the (boffmedia) layout). The old v2 `FloatingSection` chrome
// was removed here; unmigrated pages in this group (juegos, sugerir) render
// without the decorative blobs until they're migrated too.
export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
