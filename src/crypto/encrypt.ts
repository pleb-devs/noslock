import sodium from "libsodium-wrappers";
import { cryptoReady } from ".";

export interface EncryptedPaste {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  key: Uint8Array;
  docId: string;
}

/**
 * Encrypts plaintext using XChaCha20-Poly1305.
 * Generates random key and nonce for each call.
 *
 * This function implements a zero-knowledge encryption system where
 * all encryption occurs locally in the browser and no plaintext
 * ever leaves the user's device.
 *
 * @param plaintext - UTF-8 text to encrypt
 * @returns Encrypted data with key for capability URL
 * @throws Error if encryption fails
 */
export async function encryptPaste(plaintext: string): Promise<EncryptedPaste> {
  await cryptoReady;

  let key: Uint8Array | null = null;

  try {
    // Generate random 32-byte symmetric key
    key = sodium.randombytes_buf(
      sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, // 32
    );

    // Generate random 24-byte nonce
    const nonce = sodium.randombytes_buf(
      sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES, // 24
    );

    // Generate random document ID
    const docIdBytes = sodium.randombytes_buf(32);
    const docId = sodium.to_hex(docIdBytes);
    sodium.memzero(docIdBytes); // Clear random bytes from memory

    // Validate input size to prevent DoS attacks
    const NOSTR_SIZE_LIMIT = 128 * 1024; // 128KB Nostr event limit
    const plaintextBytes = sodium.from_string(plaintext);
    if (plaintextBytes.length > NOSTR_SIZE_LIMIT) {
      throw new Error(
        `Content too large: ${plaintextBytes.length} > ${NOSTR_SIZE_LIMIT}`,
      );
    }

    // Encrypt with XChaCha20-Poly1305
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintextBytes,
      null, // no additional authenticated data
      null, // no secret nonce prefix
      nonce,
      key,
    );

    // Return a copy of the key before clearing memory
    return {
      ciphertext,
      nonce,
      key: new Uint8Array(key),
      docId,
    };
  } finally {
    // Clear sensitive data from memory
    if (key) sodium.memzero(key);
  }
}
