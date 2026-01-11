# noslock_

> Example project from the [PlebDevs AI Dev Course](https://plebdevs.com)

Zero-knowledge encrypted pastebin on Nostr.

## what it does

- You write text
- It encrypts locally (XChaCha20-Poly1305)
- Publishes ciphertext to Nostr relays
- Gives you a link: `noslock://doc_id#key`
- Anyone with the link can decrypt

Relays never see plaintext. Key stays in the URL fragment.

## stack

- Vite + React + TypeScript
- libsodium.js (crypto)
- snstr (Nostr)
- Tailwind

## docs

See `llm/` for project documentation.
