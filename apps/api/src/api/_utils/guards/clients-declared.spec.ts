import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * Guard-rail for the client model itself.
 *
 * `DEFAULT_CLIENTS` is web + ingame, so a desktop session is refused by every
 * route that does not opt in with `@Clients(CLIENT.DESKTOP)`. That default is
 * the safe direction, but it fails LOUDLY and late: a new app route wired with
 * `DesktopAuthGuard` and no declaration compiles, ships, and 403s the app.
 *
 * So: any controller that authenticates a desktop session must also declare it.
 * Adding one without the decorator fails here instead of in the app.
 */
const API_SRC = join(__dirname, '..', '..', '..');

const DESKTOP_GUARDS = [
  'DesktopAuthGuard',
  'DesktopAdminGuard',
  'DesktopOrUserAuthGuard',
];

function controllerFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return controllerFiles(full);
    return entry.endsWith('.controller.ts') ? [full] : [];
  });
}

describe('client model declarations', () => {
  const files = controllerFiles(API_SRC);

  it('finds the controllers to check', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('every controller that authenticates a desktop session declares CLIENT.DESKTOP', () => {
    const missing = files
      .filter((file) => {
        const source = readFileSync(file, 'utf8');
        const usesDesktop = DESKTOP_GUARDS.some((guard) =>
          source.includes(`@UseGuards(${guard}`),
        );
        return usesDesktop && !source.includes('CLIENT.DESKTOP');
      })
      .map((file) => relative(API_SRC, file).split(sep).join('/'));

    expect(missing).toEqual([]);
  });
});
