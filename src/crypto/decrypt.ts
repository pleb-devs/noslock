import sodium from "libsodium-wrappers";
import { cryptoReady } from ".";

/**
 * Decrypts ciphertext using XChaCha20-Poly1305.
 * This function implements a zero-knowledge decryption system where
 * all decryption occurs locally in the browser and no plaintext
 * ever leaves the user's device.
 *
 * @param ciphertext - Encrypted data
 * @param nonce - 24-byte nonce used for encryption
 * @param key - 32-byte key used for encryption
 * @returns Decrypted plaintext
 * @throws DecryptionError if decryption fails due to invalid key or corrupted data
 */
export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

export async function decryptPaste(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array,
): Promise<string> {
  await cryptoReady;

  // Validate input lengths to prevent undefined behavior
  if (key.length !== 32) {
    throw new DecryptionError("Invalid key length");
  }
  if (nonce.length !== 24) {
    throw new DecryptionError("Invalid nonce length");
  }
  // XChaCha20-Poly1305 requires at least 16 bytes (Poly1305 auth tag)
  if (ciphertext.length < 16) {
    throw new DecryptionError("Invalid ciphertext length");
  }

  let plaintext: Uint8Array | null = null;

  try {
    plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null, // no secret nonce prefix
      ciphertext,
      null, // no additional authenticated data
      nonce,
      key,
    );

    return sodium.to_string(plaintext);
  } catch {
    // Don't log the actual error as it could contain sensitive info
    throw new DecryptionError(
      "Failed to decrypt: invalid key or corrupted data",
    );
  } finally {
    if (plaintext) sodium.memzero(plaintext);
  }
}
