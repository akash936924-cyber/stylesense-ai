/**
 * Guard for image URLs that arrive from the client (rerank candidates):
 * block anything that could reach internal services (SSRF). https only,
 * no credentials, default port, no IP literals or local hostnames.
 * DNS-rebinding-grade protection is out of scope for this local-first MVP.
 */
export function isSafeRemoteImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".")) return false; // localhost, bare intranet names
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  if (host.includes(":") || host.startsWith("[")) return false; // IPv6 literal
  if (/\.(local|localhost|internal|intranet|lan|home|corp)$/.test(host)) return false;
  return true;
}
