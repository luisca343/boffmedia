import "../globals.css";
import { GlobalProviders } from "../GlobalProviders";

/**
 * `/showdown` sits at the app root, outside both `(boffmedia)` and
 * `smartrotom` — the two route groups that mount `GlobalProviders`. Its role
 * gate calls `useBoffSession()`, so with no `SessionProvider` above it
 * `useSession()` returned undefined and the destructure threw: the page failed
 * to prerender and would have thrown in the browser too.
 *
 * This is the same layout every other top-level group already has.
 */
export default function ShowdownLayout({ children }: { children: React.ReactNode }) {
  return <GlobalProviders>{children}</GlobalProviders>;
}
