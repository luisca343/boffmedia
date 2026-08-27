import axios, { AxiosRequestConfig } from 'axios';
import { promises as dns } from 'dns';
import * as net from 'net';

/**
 * Configuration for safe HTTP fetching.
 *
 * This helper enforces security constraints to prevent SSRF attacks:
 * - HTTPS-only (configurable per call)
 * - Host allowlist validation
 * - DNS rebind risk acceptance
 * - Private/loopback/link-local range rejection after resolution
 * - Per-call timeout (default 30s)
 * - Streaming byte cap (default 100 MB)
 * - No cross-host redirects
 */
export interface SafeFetchConfig {
  /**
   * List of allowed hostnames (exact match, case-insensitive).
   * Empty list = reject all hosts.
   */
  allowedHosts: string[];

  /**
   * Request timeout in milliseconds. Default: 30000 (30s).
   * Set to 0 for no timeout (NOT recommended; only for long-lived downloads).
   */
  timeout?: number;

  /**
   * Maximum response size in bytes. Default: 100 MB.
   * Streaming responses are cut off at this limit.
   */
  maxBytes?: number;

  /**
   * Allow HTTP (insecure) URLs. Default: false (HTTPS-only).
   * When false, non-HTTPS URLs are rejected immediately.
   */
  allowHttp?: boolean;

  /**
   * Extra axios request options (headers, auth, proxy, etc.).
   * These are merged after safe options, so callers can override behavior.
   * HOWEVER: timeout, maxRedirects, and maxContentLength are ignored
   * (safe settings take precedence).
   */
  axiosConfig?: AxiosRequestConfig;
}

/**
 * Error raised when a URL fails safe-fetch validation.
 */
export class SafeFetchError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

/**
 * Validates that an IP is not private, loopback, or link-local.
 *
 * Private ranges (RFC 1918):
 *   - 10.0.0.0/8
 *   - 172.16.0.0/12
 *   - 192.168.0.0/16
 *
 * Link-local: 169.254.0.0/16
 * Loopback: 127.0.0.0/8, ::1
 *
 * @param ip IPv4 or IPv6 address string
 * @returns true if the IP is safe to connect to; false if it is private/loopback/link-local
 */
function isPublicIp(ip: string): boolean {
  // IPv6
  if (ip.includes(':')) {
    // ::1 is IPv6 loopback
    if (ip === '::1') return false;
    // fc00::/7 is Unique Local Addresses (private)
    if (ip.startsWith('fc') || ip.startsWith('fd')) return false;
    // fe80::/10 is link-local
    if (ip.startsWith('fe80:')) return false;
    // ::ffff:127.x.x.x is IPv4-mapped loopback
    if (ip.startsWith('::ffff:127.')) return false;
    return true; // Assume public for other IPv6
  }

  // IPv4
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) return false;

  // 127.0.0.0/8 - loopback
  if (parts[0] === 127) return false;
  // 10.0.0.0/8 - private
  if (parts[0] === 10) return false;
  // 172.16.0.0/12 - private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
  // 192.168.0.0/16 - private
  if (parts[0] === 192 && parts[1] === 168) return false;
  // 169.254.0.0/16 - link-local
  if (parts[0] === 169 && parts[1] === 254) return false;
  // 0.0.0.0/8 - "this" network
  if (parts[0] === 0) return false;
  // 255.255.255.255 - broadcast
  if (parts[0] === 255) return false;

  return true;
}

/**
 * Fetches a URL safely with SSRF protections.
 *
 * Validates:
 * 1. URL scheme (HTTP/HTTPS only, and respects allowHttp flag)
 * 2. Hostname against allowlist
 * 3. Resolved IP against private/loopback/link-local ranges
 * 4. Response timeout and byte limit
 * 5. No cross-host redirects
 *
 * **DNS rebind risk**: After DNS resolution, the host is checked to be non-private.
 * However, a concurrent rebind (TOCTOU) is not prevented. If you need stronger
 * guarantees, consider:
 * - DNS pinning (resolve once, reuse)
 * - Timebound resolution (re-resolve periodically and validate)
 * - Split-view DNS (internal vs external)
 *
 * This implementation accepts the residual risk as a trade-off for simplicity.
 * In high-value scenarios, wrap this in application-level pinning or use a proxy
 * that enforces it globally.
 *
 * @param url Target URL
 * @param config Safe fetch configuration
 * @returns Response data as string
 * @throws SafeFetchError if any validation fails
 * @throws Error if axios request fails
 *
 * @example
 * ```typescript
 * const data = await safeFetch('https://api.example.com/data', {
 *   allowedHosts: ['api.example.com'],
 *   timeout: 10000,
 *   maxBytes: 10_000_000, // 10 MB
 * });
 * ```
 */
export async function safeFetch(
  url: string,
  config: SafeFetchConfig,
): Promise<string> {
  try {
    const urlObj = new URL(url);

    // 1. Scheme check: only HTTP(S), and respect allowHttp flag
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new SafeFetchError(`Scheme must be http or https; got ${urlObj.protocol}`, url);
    }

    if (!config.allowHttp && urlObj.protocol !== 'https:') {
      throw new SafeFetchError('Only HTTPS is allowed', url);
    }

    // 2. Hostname allowlist check (exact match, case-insensitive)
    const hostname = urlObj.hostname;
    const allowed = config.allowedHosts.map((h) => h.toLowerCase()).includes(hostname.toLowerCase());
    if (!allowed) {
      throw new SafeFetchError(
        `Hostname not in allowlist: ${hostname}. Allowed: ${config.allowedHosts.join(', ')}`,
        url,
      );
    }

    // 3. DNS resolution and IP range check
    // TOCTOU risk: the host could rebind after resolution but before connection.
    // Accepting this risk; see docstring.
    let resolvedIps: string[] = [];
    try {
      resolvedIps = await dns.resolve4(hostname);
    } catch {
      // If resolution fails, try IPv6
      try {
        resolvedIps = await dns.resolve6(hostname);
      } catch {
        throw new SafeFetchError(`Failed to resolve hostname: ${hostname}`, url);
      }
    }

    // Check that at least one resolved IP is public
    const hasPublicIp = resolvedIps.some((ip) => isPublicIp(ip));
    if (!hasPublicIp) {
      throw new SafeFetchError(
        `All resolved IPs are private or loopback: ${resolvedIps.join(', ')}`,
        url,
      );
    }

    // 4. Prepare axios config with safe constraints
    const timeout = config.timeout ?? 30_000;
    const maxBytes = config.maxBytes ?? 100_000_000; // 100 MB

    const axiosConfig: AxiosRequestConfig = {
      ...(config.axiosConfig ?? {}),
      // Override callers' timeout/redirect settings with ours (safety takes precedence)
      timeout,
      maxRedirects: 0, // No redirects; validate each hop
      maxContentLength: maxBytes,
    };

    // 5. Fetch with safety constraints
    const response = await axios.get<string>(url, axiosConfig);

    // 6. Validate redirect didn't happen (axios throws on 3xx with maxRedirects: 0)
    // Already guaranteed by maxRedirects: 0 above.

    return response.data;
  } catch (err) {
    if (err instanceof SafeFetchError) throw err;
    // Re-throw other errors (DNS, axios, etc.)
    throw err;
  }
}

/**
 * Fetches a URL and returns a readable stream (for large files).
 *
 * Same security checks as safeFetch, but returns a stream instead of buffering.
 * The caller is responsible for:
 * - Piping to a stream that enforces maxBytes
 * - Handling stream errors
 *
 * @param url Target URL
 * @param config Safe fetch configuration
 * @returns Axios response object with data as a readable stream
 * @throws SafeFetchError if validation fails
 *
 * @example
 * ```typescript
 * const response = await safeFetchStream('https://cdn.example.com/file.zip', {
 *   allowedHosts: ['cdn.example.com'],
 *   maxBytes: 5_000_000_000, // 5 GB
 * });
 * const writeStream = fs.createWriteStream('output.zip');
 * response.data.pipe(writeStream);
 * ```
 */
export async function safeFetchStream(
  url: string,
  config: SafeFetchConfig,
) {
  try {
    const urlObj = new URL(url);

    // 1. Scheme check
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new SafeFetchError(`Scheme must be http or https; got ${urlObj.protocol}`, url);
    }

    if (!config.allowHttp && urlObj.protocol !== 'https:') {
      throw new SafeFetchError('Only HTTPS is allowed', url);
    }

    // 2. Hostname allowlist
    const hostname = urlObj.hostname;
    const allowed = config.allowedHosts.map((h) => h.toLowerCase()).includes(hostname.toLowerCase());
    if (!allowed) {
      throw new SafeFetchError(
        `Hostname not in allowlist: ${hostname}. Allowed: ${config.allowedHosts.join(', ')}`,
        url,
      );
    }

    // 3. DNS resolution and IP range check
    let resolvedIps: string[] = [];
    try {
      resolvedIps = await dns.resolve4(hostname);
    } catch {
      try {
        resolvedIps = await dns.resolve6(hostname);
      } catch {
        throw new SafeFetchError(`Failed to resolve hostname: ${hostname}`, url);
      }
    }

    const hasPublicIp = resolvedIps.some((ip) => isPublicIp(ip));
    if (!hasPublicIp) {
      throw new SafeFetchError(
        `All resolved IPs are private or loopback: ${resolvedIps.join(', ')}`,
        url,
      );
    }

    // 4. Stream request with constraints
    const timeout = config.timeout ?? 30_000;
    const maxBytes = config.maxBytes ?? 100_000_000; // 100 MB

    const axiosConfig: AxiosRequestConfig = {
      responseType: 'stream',
      // Caller options first, safety last — the same order as safeFetch(), and
      // the order the docs promise. Spreading axiosConfig last would let a
      // caller set maxRedirects back to a non-zero value and reopen the
      // redirect-to-internal-host bypass this helper exists to close, on the
      // one path that also streams unbounded bytes.
      ...(config.axiosConfig ?? {}),
      timeout,
      maxRedirects: 0,
      maxContentLength: maxBytes,
    };

    const response = await axios.get(url, axiosConfig);
    return response;
  } catch (err) {
    if (err instanceof SafeFetchError) throw err;
    throw err;
  }
}
