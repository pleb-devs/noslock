Purpose: Noslock technology choices and implementation patterns.

# Noslock Tech Stack

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                      Browser (PWA)                         │
├────────────────────────────────────────────────────────────┤
│  React UI  │  React Router  │  Tailwind CSS               │
├────────────┼────────────────┼──────────────────────────────┤
│            │                │                              │
│  Crypto    │     Nostr      │    URL Handling              │
│  Module    │     Client     │                              │
│            │                │                              │
│ libsodium  │     snstr      │  window.location.hash        │
│            │                │                              │
└────────────┴────────────────┴──────────────────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  Nostr Relays   │
            │  (ciphertext)   │
            └─────────────────┘
```

## Frontend Stack

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.x | Build tool and dev server |
| react | ^18.x | UI framework |
| react-dom | ^18.x | React DOM renderer |
| react-router-dom | ^6.x | Client-side routing |
| typescript | ^5.x | Type safety |
| tailwindcss | ^3.x | Utility-first CSS |

## Cryptography (libsodium.js)

**Package**: `libsodium-wrappers`

Noslock uses **symmetric AEAD encryption**, not NIP-04/NIP-44 keypair encryption. See `/llm/context/noslock-crypto.md` for full details.

### Encrypt Function

```typescript
import sodium from 'libsodium-wrappers';

interface EncryptedPaste {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  key: Uint8Array;
  docId: string;
}

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
```

### Decrypt Function

```typescript
export async function decryptPaste(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<string> {
  await sodium.ready;

  const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,  // no secret nonce prefix
    ciphertext,
    null,  // no additional authenticated data
    nonce,
    key
  );

  return sodium.to_string(plaintext);
}
```

### Hex Encoding Utilities

```typescript
export function keyToHex(key: Uint8Array): string {
  return sodium.to_hex(key);
}

export function hexToKey(hex: string): Uint8Array {
  return sodium.from_hex(hex);
}
```

## Nostr Integration (snstr)

**Package**: `snstr`

snstr handles **relay communication only**. It does NOT handle content encryption (that's libsodium's job).

### Event Structure (Kind 30078)

```typescript
// Noslock encrypted paste event
{
  kind: 30078,                           // Addressable event kind
  content: "<base64(nonce || ciphertext)>",
  tags: [
    ["d", "<doc_id>"],                   // Addressable identifier
    ["client", "noslock"]                // Optional: client tag
  ],
  pubkey: "<signer_pubkey>",
  created_at: <unix_timestamp>,
  id: "<event_id>",
  sig: "<signature>"
}
```

### Publish Encrypted Paste

```typescript
import { Nostr, generateKeypair } from 'snstr';

const DEFAULT_RELAYS = [
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.damus.io'
];

export async function publishPaste(
  docId: string,
  nonce: Uint8Array,
  ciphertext: Uint8Array
): Promise<string> {
  const client = new Nostr(DEFAULT_RELAYS);
  await client.connectToRelays();

  // Combine nonce + ciphertext and base64 encode
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  const content = btoa(String.fromCharCode(...combined));

  // Generate ephemeral keypair for signing (or use stored keys)
  const keys = await client.generateKeys();

  // Create and publish event
  const event = await client.createEvent({
    kind: 30078,
    content,
    tags: [
      ['d', docId],
      ['client', 'noslock']
    ]
  });

  await client.publish(event);
  client.disconnectFromRelays();

  return event.id;
}
```

### Fetch Encrypted Paste

```typescript
export async function fetchPaste(docId: string): Promise<{
  nonce: Uint8Array;
  ciphertext: Uint8Array;
} | null> {
  const client = new Nostr(DEFAULT_RELAYS);
  await client.connectToRelays();

  // Query by d-tag (addressable event)
  const event = await client.fetchOne(
    [{ kinds: [30078], '#d': [docId] }],
    { maxWait: 5000 }
  );

  client.disconnectFromRelays();

  if (!event) return null;

  // Decode base64 content
  const combined = Uint8Array.from(
    atob(event.content),
    c => c.charCodeAt(0)
  );

  // Split into nonce (24 bytes) and ciphertext
  const nonce = combined.slice(0, 24);
  const ciphertext = combined.slice(24);

  return { nonce, ciphertext };
}
```

## Capability URL Handling

### URL Format

```
noslock://<doc_id>#<key_hex>
```

- **Protocol**: `noslock://` (custom scheme)
- **doc_id**: 64-character hex string (32 bytes)
- **key_hex**: 64-character hex string (32 bytes) in fragment

### For Web Deployment

Since browsers don't natively handle `noslock://`, the web version uses:

```
https://noslock.app/<doc_id>#<key_hex>
```

### URL Utilities

```typescript
export function buildCapabilityUrl(docId: string, key: Uint8Array): string {
  const keyHex = sodium.to_hex(key);
  // For web: return `${window.location.origin}/${docId}#${keyHex}`;
  return `noslock://${docId}#${keyHex}`;
}

export function parseCapabilityUrl(url: string): {
  docId: string;
  key: Uint8Array;
} {
  const parsed = new URL(url);

  // Handle both noslock:// and https://
  let docId: string;
  if (parsed.protocol === 'noslock:') {
    docId = parsed.pathname.replace(/^\/\//, '');
  } else {
    docId = parsed.pathname.slice(1); // remove leading /
  }

  const keyHex = parsed.hash.slice(1); // remove leading #
  const key = sodium.from_hex(keyHex);

  return { docId, key };
}
```

## Dependency Summary

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| libsodium-wrappers | ~80kb | XChaCha20-Poly1305 encryption |
| snstr | ~28kb | Nostr relay communication |
| react-router-dom | ~17kb | URL routing |
| **Total runtime** | ~125kb | |

## Project Structure

```
src/
├── components/
│   ├── Editor.tsx       # Text input + Create button
│   ├── Share.tsx        # Display capability URL
│   ├── Reader.tsx       # Fetch and display content
│   └── Error.tsx        # Error states
├── crypto/
│   ├── encrypt.ts       # encryptPaste()
│   ├── decrypt.ts       # decryptPaste()
│   └── keys.ts          # Key generation and hex utils
├── nostr/
│   ├── client.ts        # snstr configuration
│   ├── publish.ts       # publishPaste()
│   └── fetch.ts         # fetchPaste()
├── utils/
│   └── url.ts           # Capability URL parsing
├── App.tsx              # Router setup
└── main.tsx             # Entry point
```
