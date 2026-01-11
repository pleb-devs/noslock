Purpose: Noslock project definition - zero-knowledge encrypted pastebin on Nostr.

# Noslock Project Overview

## Snapshot

| Aspect | Detail |
|--------|--------|
| **Project** | Noslock v1 - encrypted pastebin |
| **Type** | Browser-based PWA |
| **Encryption** | Symmetric XChaCha20-Poly1305 (see `/llm/context/noslock-crypto.md`) |
| **Access Model** | Capability URLs - anyone with the link can decrypt |
| **Storage** | Nostr relays (ciphertext only) |

## Mission

Deliver a zero-knowledge pastebin where users encrypt content locally and publish only ciphertext to Nostr relays. Relays never see plaintext. Access is controlled by sharing a capability URL containing the decryption key in the URL fragment.

## Core Objectives (v1 MVP)

1. **Local-first encryption** using XChaCha20-Poly1305 via libsodium.js
2. **Capability URLs**: `noslock://<doc_id>#<key_hex>` - key never leaves the fragment
3. **Nostr storage**: Publish encrypted events to multiple relays (kind 30078)
4. **Simple UX**: write text -> encrypt -> get link -> share -> recipient decrypts

## Non-Goals for v1

These are explicitly out of scope for MVP:

- Syntax highlighting
- Manual relay selection
- Link revocation
- Edit/versioning (each paste is immutable)
- NIP-44 encrypted DM sharing (future enhancement)
- Expiration/burn-after-read
- User accounts or identity

## Audience

- **Privacy advocates** sharing sensitive text without trusting servers
- **Developers** needing quick, encrypted snippet sharing
- **Anyone** who wants pastebin simplicity with real encryption

## Delivery Phases

### Phase 1: Setup
- Scaffold Vite + React + TypeScript + Tailwind
- Implement crypto primitives (encrypt/decrypt with libsodium.js)
- Local round-trip testing
- No relay integration

### Phase 2: MVP
- Integrate snstr for Nostr relay communication
- Write flow: encrypt -> publish -> show capability URL
- Read flow: fetch event -> decrypt -> display
- Error handling and polish

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Crypto Module  │────▶│  Nostr Relays   │
│  (React + TS)   │     │  (libsodium.js) │     │    (snstr)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               Encrypt/Decrypt           Store/Fetch
        │               locally only              ciphertext
        │                                               │
        └──────────────────────┬────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Capability URL     │
                    │  noslock://id#key   │
                    └─────────────────────┘
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS |
| Crypto | libsodium-wrappers (XChaCha20-Poly1305) |
| Nostr | snstr (relay communication) |
| Routing | React Router DOM |

## Constraints

- **No revocation**: If a link leaks, access leaks - this is by design
- **No edits**: Each paste is immutable; new content = new link
- **Relay dependency**: Availability depends on relay uptime
- **No server-side storage**: Zero knowledge architecture
- **Fragment security**: The `#key` keeps decryption client-side, but users must share links carefully

## Success Criteria

### Phase 1 (Setup)
- Encrypt/decrypt round-trip works locally
- libsodium.js integration verified
- Basic UI renders

### Phase 2 (MVP)
- Full write/read flow works across 2+ relays
- Capability URLs correctly parse and decrypt
- Graceful error handling for network/decrypt failures
- Mobile-responsive layout

### Overall
A user can: write text -> get shareable link -> share with anyone -> recipient decrypts and views content
