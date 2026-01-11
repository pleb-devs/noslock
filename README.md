# Noslock

Encrypted pastebin on Nostr - zero-knowledge text sharing.

## Project Overview

Noslock is a browser-based PWA that allows users to create encrypted text pastes that are stored on Nostr relays. The encryption happens entirely in the browser using XChaCha20-Poly1305, ensuring that no plaintext ever reaches the relays.

## Features

- Zero-knowledge encryption using libsodium.js
- Capability URLs for secure sharing (`noslock://<doc_id>#<key_hex>`)
- Nostr relay integration for storage
- Mobile-responsive UI with terminal aesthetic
- Client-side only processing

## Setup

This project was scaffolded with Vite + React + TypeScript + Tailwind CSS.

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # React components
│   ├── Editor.tsx    # Text input and encryption
│   ├── Share.tsx     # Capability URL display
│   └── Reader.tsx    # URL parsing and content display
├── crypto/           # Encryption logic
│   ├── encrypt.ts    # encryptPaste function
│   ├── decrypt.ts    # decryptPaste function
│   └── keys.ts       # Key utilities
├── nostr/            # Nostr relay integration (empty for now)
├── utils/            # Shared utilities
│   ├── url.ts        # Capability URL parsing and building
│   └── clipboard.ts  # Clipboard utilities
├── App.tsx           # Routing setup
└── main.tsx          # Entry point
```

## Crypto Implementation

Uses XChaCha20-Poly1305 symmetric encryption via libsodium.js for:
- Generating random keys and nonces
- Encrypting/decrypting content
- Building capability URLs

## License

MIT