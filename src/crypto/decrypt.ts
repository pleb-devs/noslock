import sodium from "libsodium-wrappers";

/**
 * Decrypts ciphertext using XChaCha20-Poly1305.
 *
 * @param ciphertext - Encrypted data
 * @param nonce - 24-byte nonce used for encryption
 * @param key - 32-byte key used for encryption
 * @returns Decrypted plaintext
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
  await sodium.ready;

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
  } catch (error) {
    console.log("decryption error", error);
    throw new DecryptionError(
      "Failed to decrypt: invalid key or corrupted data",
    );
  } finally {
    if (plaintext) sodium.memzero(plaintext);
  }
}
