export const getValidSubdomain = (host?: string | null) => {
    let subdomain: string | null = null;
    if (!host && typeof window !== 'undefined') {
      // On client side, get the host from window
      host = window.location.host;
    }
    console.log('Host:', host);
    if (host && host.split('.').length > 2) {
      const candidate = host.split('.')[0];
      if (candidate && !candidate.includes('localhost') && !candidate.includes('local')) {
        // Valid candidate
        subdomain = candidate;
      }
    }
    return subdomain;
};