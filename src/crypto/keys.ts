import sodium from 'libsodium-wrappers';

/**
 * Converts a key (Uint8Array) to hexadecimal string
 * @param key - 32-byte key
 * @returns Hexadecimal representation
 */
export function keyToHex(key: Uint8Array): string {
  return sodium.to_hex(key);
}

/**
 * Converts a hexadecimal string to key (Uint8Array)
 * @param hex - 64-character hex string
 * @returns 32-byte key
 */
export function hexToKey(hex: string): Uint8Array {
  // Validate hex format (64 hex characters for 32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('Invalid key format: must be 64-character hex string');
  }
  return sodium.from_hex(hex);
}

/**
 * Generates a random document ID (64-character hex string)
 * @returns Document ID as hex string
 */
export function generateDocId(): string {
  const docIdBytes = sodium.randombytes_buf(32);
  return sodium.to_hex(docIdBytes);
}
