import sodium from "libsodium-wrappers";

/**
 * Builds a capability URL for a paste
 * @param docId - 64-character hex document ID
 * @param key - 32-byte encryption key
 * @returns Capability URL in format noslock://<doc_id>#<key_hex>
 */
export function buildCapabilityUrl(docId: string, key: Uint8Array): string {
  const keyHex = sodium.to_hex(key);
  // For web: return `${window.location.origin}/${docId}#${keyHex}`;
  return `noslock://${docId}#${keyHex}`;
}

/**
 * Parses a capability URL into docId and key
 * @param url - Capability URL to parse
 * @returns Parsed docId and key
 * @throws Error if URL format is invalid
 */
export function parseCapabilityUrl(url: string): {
  docId: string;
  key: Uint8Array;
} {
  // Validate URL format
  if (!url.includes("#")) {
    throw new Error("Invalid URL: missing key fragment");
  }

  // Handle noslock:// protocol
  if (url.startsWith("noslock://")) {
    const parts = url.substring(10).split("#"); // Remove 'noslock://' and split on '#'
    const docId = parts[0];
    const keyHex = parts[1];

    // Validate key length (32 bytes = 64 hex chars)
    if (keyHex.length !== 64) {
      throw new Error("Invalid key length");
    }

    // Validate hex format
    if (!/^[a-f0-9]+$/i.test(keyHex)) {
      throw new Error("Invalid key format");
    }

    const key = sodium.from_hex(keyHex);
    return { docId, key };
  }

  // Handle https:// protocol (web version)
  const parsed = new URL(url);
  const docId = parsed.pathname.slice(1); // remove leading /
  const keyHex = parsed.hash.slice(1); // remove leading #

  // Validate key length (32 bytes = 64 hex chars)
  if (keyHex.length !== 64) {
    throw new Error("Invalid key length");
  }

  // Validate hex format
  if (!/^[a-f0-9]+$/i.test(keyHex)) {
    throw new Error("Invalid key format");
  }

  const key = sodium.from_hex(keyHex);

  return { docId, key };
}
