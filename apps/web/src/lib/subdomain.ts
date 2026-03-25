const pages = ["battlesim", "smartrotom"];

export const getValidSubdomain = (host?: string | null): string | null => {
  if (!host) {
    return null;
  }

  const parts = host.split('.');
  if (parts.length > 2) {
    const candidate = parts[0];
    if (candidate && !candidate.includes('localhost') && !candidate.includes('local')) {
      // Valid candidate
      return candidate;
    }
  }

  return null;
};