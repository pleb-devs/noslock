import sodium from 'libsodium-wrappers';

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
 * @param plaintext - UTF-8 text to encrypt
 * @returns Encrypted data with key for capability URL
 */
export async function encryptPaste(plaintext: string): Promise<EncryptedPaste> {
  await sodium.ready;

  // Generate random 32-byte symmetric key
  const key = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES // 32
  );

  // Generate random 24-byte nonce
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES // 24
  );

  // Generate random document ID
  const docIdBytes = sodium.randombytes_buf(32);
  const docId = sodium.to_hex(docIdBytes);

  // Encrypt with XChaCha20-Poly1305
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(plaintext),
    null,  // no additional authenticated data
    null,  // no secret nonce prefix
    nonce,
    key
  );

  return { ciphertext, nonce, key, docId };
}
