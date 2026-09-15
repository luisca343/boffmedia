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

// These controllers are public to anonymous tool users, but the desktop host
// may still attach its optional launcher JWT. Keep the explicit opt-in close to
// the route so a future refactor cannot reintroduce a token-dependent 403.
const PUBLIC_TOOL_CONTROLLERS = [
  'api/boffmedia/herramientas/mhwilds/mhwilds.controller.ts',
  'api/boffmedia/herramientas/mhwilds/mhwilds-anatomy.controller.ts',
  'api/boffmedia/herramientas/pokemon/tcgpocket/tcg.controller.ts',
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

  it('public tool controllers admit the optional desktop bearer', () => {
    const missing = PUBLIC_TOOL_CONTROLLERS.filter((relativePath) => {
      const source = readFileSync(join(API_SRC, relativePath), 'utf8');
      return source.includes('@Public()') && !source.includes('CLIENT.DESKTOP');
    });

    expect(missing).toEqual([]);
  });
});
