import { describe, it, expect } from 'vitest';
import { encryptPaste } from '../encrypt';
import { decryptPaste } from '../decrypt';

describe('crypto', () => {
  it('round-trips correctly', async () => {
    const plaintext = 'Hello, Noslock!';
    const { ciphertext, nonce, key } = await encryptPaste(plaintext);
    const decrypted = await decryptPaste(ciphertext, nonce, key);
    expect(decrypted).toBe(plaintext);
  });

  it('fails with wrong key', async () => {
    const { ciphertext, nonce } = await encryptPaste('secret');
    const wrongKey = new Uint8Array(32);
    await expect(decryptPaste(ciphertext, nonce, wrongKey)).rejects.toThrow();
  });
});
