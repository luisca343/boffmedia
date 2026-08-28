/**
 * `env` parses `process.env` at import time, so each case sets the variables
 * and re-imports the module under `jest.isolateModules`.
 */
function urlWith(
  vars: Record<string, string | undefined>,
  path: string,
): string | null {
  const saved = { ...process.env };
  Object.assign(process.env, vars);
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
  }
  try {
    let url: string | null = null;
    jest.isolateModules(() => {
      url = (
        require('./asset-url') as typeof import('./asset-url')
      ).absoluteAssetUrl(path);
    });
    return url;
  } finally {
    process.env = saved;
  }
}

// A real deployment's shape: the read-only tree is served under a `/public`
// serve-root, the writable uploads store at the server root.
const DEPLOYED = { PUBLIC_DIR: 'http://api.example.test/public' };

describe('absoluteAssetUrl', () => {
  it('serves the read-only tree from PUBLIC_DIR, serve-root and all', () => {
    expect(urlWith(DEPLOYED, '/boffmedia/img/profile.png')).toBe(
      'http://api.example.test/public/boffmedia/img/profile.png',
    );
    expect(urlWith(DEPLOYED, '/smartrotom/img/x.png')).toBe(
      'http://api.example.test/public/smartrotom/img/x.png',
    );
  });

  it('serves uploads from the ORIGIN, because they are a different mount', () => {
    // The bug this file exists for. `main.ts` mounts the uploads store at the
    // server root, so PUBLIC_DIR's `/public` serve-root must be dropped —
    // `/public/uploads/...` is a verified 404 on every host, and the launcher
    // logged exactly that url as undownloadable.
    expect(urlWith(DEPLOYED, '/uploads/profiles/42.png')).toBe(
      'http://api.example.test/uploads/profiles/42.png',
    );
    expect(urlWith(DEPLOYED, '/uploads/sharex/a.png')).toBe(
      'http://api.example.test/uploads/sharex/a.png',
    );
  });

  it('does not mistake a path that merely starts with the same letters', () => {
    expect(urlWith(DEPLOYED, '/uploadsomething/x.png')).toBe(
      'http://api.example.test/public/uploadsomething/x.png',
    );
  });

  it('joins exactly one slash however the stored path is written', () => {
    // `//uploads/x.png` would be a protocol-relative url, not a path.
    expect(urlWith(DEPLOYED, 'uploads/profiles/42.png')).toBe(
      'http://api.example.test/uploads/profiles/42.png',
    );
    expect(urlWith(DEPLOYED, '///uploads/profiles/42.png')).toBe(
      'http://api.example.test/uploads/profiles/42.png',
    );
    expect(
      urlWith({ PUBLIC_DIR: 'http://api.example.test/public///' }, '/boffmedia/a.png'),
    ).toBe('http://api.example.test/public/boffmedia/a.png');
  });

  it('needs no split on the WEB_URL fallback, which serves both shapes', () => {
    // The website has the read-only tree in its own public/ and proxies
    // /uploads/* to this API, so one base covers both.
    const web = { PUBLIC_DIR: undefined, WEB_URL: 'https://web.example.test' };
    expect(urlWith(web, '/uploads/profiles/42.png')).toBe(
      'https://web.example.test/uploads/profiles/42.png',
    );
    expect(urlWith(web, '/boffmedia/img/profile.png')).toBe(
      'https://web.example.test/boffmedia/img/profile.png',
    );
  });

  it('ignores a PUBLIC_DIR that is a path rather than an absolute base', () => {
    // The name says DIR and `assetUrl` prefixes any string happily, so this is
    // a plausible misconfiguration — and it produces a url that is STILL
    // relative, which fails in the hardest way to spot.
    expect(
      urlWith(
        { PUBLIC_DIR: '/public', WEB_URL: 'https://web.example.test' },
        '/uploads/profiles/42.png',
      ),
    ).toBe('https://web.example.test/uploads/profiles/42.png');
  });

  it('returns null rather than inventing a base when neither is usable', () => {
    // The caller must treat this as "no url" — better a monogram than one
    // guaranteed to 404.
    expect(
      urlWith({ PUBLIC_DIR: '/public', WEB_URL: '/also-a-path' }, '/uploads/a.png'),
    ).toBeNull();
  });
});
