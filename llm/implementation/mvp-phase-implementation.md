## 2.  Added / Updated Source Files

| File | Purpose | Notes |
|------|---------|-------|
| `src/nostr/client.ts` | Exposes a `createClient()` helper around `snstr`'s `Nostr` class. | Only the default relays are exposed and the function returns a new instance. |
| `src/nostr/publish.ts` | Publishes a `kind 30078` event containing encrypted payload. | Content format is `cipherHex:nonceHex`. Uses optional chaining for missing snstr API. |
| `src/nostr/fetch.ts` | Retrieves a `kind 30078` event by the `d` tag. Parses the two hex strings back into `Uint8Array` values. |
| `src/nostr/types.d.ts` | Stub TypeScript definitions for `snstr`. | Needed so the compiler knows the shape of `Nostr`. |
| `src/components/Editor.tsx` | Refactored to emit the full encryption result (docId, key, ciphertext, nonce). | Removes unused imports and keeps UI pristine. |
| `src/components/Share.tsx` | Updated to display the capability URL (`noslock://<docId>#<keyHex>`). Includes a copy‑to‑clipboard button. |
| `src/components/Reader.tsx` | Full read flow implementation: fetch event, decrypt, display or show error states. | Handles fetching, decrypting, not_found, and decrypt_error states. |
| `src/App.tsx` | Centralised state: after encryption the app publishes via `publishPaste` and immediately navigates to `/${docId}` using `useNavigate` while preserving state. | Removed page reload logic and added programmatic routing. |
| `src/nostr/publish.ts` | Implements publish logic. |
| `src/utils/url.ts` | Retains the original `buildCapabilityUrl` and `parseCapabilityUrl`. |

The reader now fully supports the fetch‑decryption cycle and displays appropriate status messages based on the outcome.
