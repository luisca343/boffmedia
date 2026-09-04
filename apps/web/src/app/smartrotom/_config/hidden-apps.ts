/**
 * Which SmartRotom apps are unreachable, and why.
 *
 * The map below is the source of truth: an app listed here is hidden by DEFAULT,
 * with no environment configuration required. That is deliberate — these routes
 * render a heading and nothing else, so a deploy that forgets to set a variable
 * must fail closed (app stays hidden), never open.
 *
 * `NEXT_PUBLIC_UNHIDE_APPS` (comma-separated) exists only to un-hide an app for
 * local work or staff testing. It can never hide something that is not listed here.
 *
 * Nothing is deleted: Cinder's scaffolding is still fed by the PC app
 * (IVs / natures / abilities) and must survive until Cinder is built.
 */

export type HiddenAppReason = 'archived' | 'pending-build';

export const HIDDEN_APP_CONFIG: Record<string, HiddenAppReason> = {
  // Never completed; no scheduled work. Kept in the tree, not reachable.
  cinder: 'archived',
  equipo: 'archived',
  guias: 'archived',
  // Distinct case: the API is live (POST /smartrotom/karts/carrera, GET /ranking),
  // the front-end is scheduled for its own cycle. Hidden until it exists, not indefinitely.
  karts: 'pending-build',
};

function unhiddenApps(): string[] {
  return (process.env.NEXT_PUBLIC_UNHIDE_APPS || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

export function isAppHidden(appName: string): boolean {
  if (!(appName in HIDDEN_APP_CONFIG)) return false;
  return !unhiddenApps().includes(appName);
}

export function getHiddenReason(appName: string): HiddenAppReason | null {
  return isAppHidden(appName) ? HIDDEN_APP_CONFIG[appName] : null;
}
