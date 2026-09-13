import semver from 'semver';

/** Normalize and validate the stored form of a product version. */
export function normalizeReleaseVersion(value: string): string {
  const normalized = value.trim();
  if (!normalized || /^v/i.test(normalized)) {
    throw new Error(`Invalid product version: ${value}`);
  }

  const parsed = semver.parse(normalized);
  if (!parsed || parsed.version !== normalized) {
    throw new Error(`Invalid product version: ${value}`);
  }
  return parsed.version;
}

export function isStableReleaseVersion(version: string): boolean {
  const parsed = semver.parse(version);
  return Boolean(parsed && parsed.prerelease.length === 0);
}

export function compareReleaseVersions(a: string, b: string): number {
  return semver.compare(a, b);
}
