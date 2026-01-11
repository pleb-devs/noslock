Purpose: Noslock encryption model - symmetric XChaCha20-Poly1305 with capability URLs.

# Noslock Cryptography Model

## Critical Distinction

Noslock does **NOT** use NIP-04 or NIP-44 for content encryption.

| Model | Used For | How It Works |
|-------|----------|--------------|
| **NIP-04/NIP-44** | DMs between Nostr users | ECDH between sender privkey + recipient pubkey |
| **Noslock** | Anonymous paste sharing | Symmetric AEAD with random key in URL |

NIP-04/NIP-44 create a "conversation key" tied to two identities. Noslock generates a fresh random key per paste with no identities involved. Anyone with the capability URL can decrypt.

## Encryption Scheme

- **Algorithm**: XChaCha20-Poly1305 (AEAD - Authenticated Encryption with Associated Data)
- **Library**: libsodium.js (`libsodium-wrappers` npm package)
- **Key Size**: 32 bytes (256 bits)
- **Nonce Size**: 24 bytes (192 bits)
- **Authentication**: Built-in Poly1305 MAC (detects tampering)

## Capability URL Format

```
noslock://<doc_id>#<key_hex>
```

- **doc_id**: Identifier for the Nostr event (d-tag value)
- **key_hex**: 64-character hex encoding of the 32-byte symmetric key
- **Fragment (#)**: Ensures key never sent to server in HTTP requests

## Write Flow (Encryption)

```
1. User enters plaintext
2. Generate K_doc = random 32 bytes (symmetric key)
3. Generate nonce = random 24 bytes
4. ciphertext = XChaCha20-Poly1305-Encrypt(plaintext, nonce, K_doc)
5. Generate doc_id = random 32 bytes (hex-encoded)
6. Publish Nostr event with ciphertext + nonce
7. Return capability URL: noslock://<doc_id>#<K_doc_hex>
```

## Read Flow (Decryption)

```
1. Parse doc_id from URL path
2. Parse K_doc from URL fragment (after #)
3. Fetch Nostr event by doc_id (d-tag query)
4. Extract nonce and ciphertext from event content
5. plaintext = XChaCha20-Poly1305-Decrypt(ciphertext, nonce, K_doc)
6. Display plaintext (or error if decryption fails)
```

## Code Examples

### Encryption

```typescript
import sodium from 'libsodium-wrappers';

interface EncryptResult {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  key: Uint8Array;
  docId: string;
}

async function encryptPaste(plaintext: string): Promise<EncryptResult> {
  await sodium.ready;

  // Generate random symmetric key (32 bytes)
  const key = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES
  );

  // Generate random nonce (24 bytes)
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );

  // Generate random document ID (32 bytes -> 64 hex chars)
  const docIdBytes = sodium.randombytes_buf(32);
  const docId = sodium.to_hex(docIdBytes);

  // Encrypt with XChaCha20-Poly1305
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(plaintext),
    null,  // no additional authenticated data
    null,  // no secret nonce
    nonce,
    key
  );

  return { ciphertext, nonce, key, docId };
}

function buildCapabilityUrl(docId: string, key: Uint8Array): string {
  const keyHex = sodium.to_hex(key);
  return `noslock://${docId}#${keyHex}`;
}
```

### Decryption

```typescript
import sodium from 'libsodium-wrappers';

async function decryptPaste(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<string> {
  await sodium.ready;

  try {
    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,  // no secret nonce
      ciphertext,
      null,  // no additional authenticated data
      nonce,
      key
    );
    return sodium.to_string(plaintext);
  } catch (error) {
    throw new Error('Decryption failed: invalid key or tampered ciphertext');
  }
}

function parseCapabilityUrl(url: string): { docId: string; key: Uint8Array } {
  // Parse: noslock://doc_id#key_hex
  const parsed = new URL(url);
  const docId = parsed.pathname.replace(/^\/\//, '');
  const keyHex = parsed.hash.slice(1); // remove leading #
  const key = sodium.from_hex(keyHex);
  return { docId, key };
}
```

## Security Properties

### Guarantees

- **Confidentiality**: Only someone with the key can read the content
- **Integrity**: Poly1305 MAC detects any tampering with ciphertext
- **Authenticity**: If decryption succeeds, content was encrypted with that key

### Non-Guarantees (By Design)

- **No Revocation**: Once a link is shared, access cannot be revoked
- **No Identity Binding**: Anyone with the link can decrypt (no authentication)
- **No Forward Secrecy**: If key leaks, all content encrypted with it is exposed
- **No Plausible Deniability**: The encrypted content exists on public relays

## What Noslock Does NOT Use

| Technology | Why Not Used |
|------------|--------------|
| NIP-04 | Deprecated, requires recipient identity |
| NIP-44 | Requires recipient identity (ECDH-based) |
| AES-GCM | Shorter nonces (12 bytes) increase collision risk |
| RSA/ECDSA | Asymmetric encryption not needed for this use case |

## When NIP-44 Might Be Used (Future)

NIP-44 could be used for a **separate feature**: sharing the capability URL privately via encrypted DM. But this is:
- A wrapper around the capability URL, not the content encryption
- An optional enhancement, not part of MVP
- Completely separate from the core symmetric encryption model
