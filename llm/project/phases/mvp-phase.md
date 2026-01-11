Purpose: MVP phase for Noslock - relay integration and complete write/read flows.

# MVP Phase

## Prerequisites

- Setup phase completed
- Crypto module working (encrypt/decrypt round-trip verified)
- URL utilities implemented
- Basic UI shell with routing

## Goals

- Integrate snstr for Nostr relay communication
- Complete write flow: encrypt -> publish -> get capability URL
- Complete read flow: fetch -> decrypt -> display
- Error handling for common failure cases
- Copy-to-clipboard for sharing

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Relay integration | Manual relay selection |
| Write flow end-to-end | Syntax highlighting |
| Read flow end-to-end | Link expiration |
| Error states | User accounts |
| Copy-to-clipboard | PWA features |
| Mobile-responsive | NIP-44 link sharing |

## Steps

### 1. Install snstr

```bash
npm install snstr
```

### 2. Nostr Client Module

**Create `src/nostr/client.ts`:**
```typescript
import { Nostr } from 'snstr';

export const DEFAULT_RELAYS = [
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.damus.io'
];

export function createClient(): Nostr {
  return new Nostr(DEFAULT_RELAYS);
}
```

**Create `src/nostr/publish.ts`:**
- `publishPaste(docId, nonce, ciphertext): Promise<string>`
- Generates ephemeral keypair for signing
- Creates kind 30078 event with d-tag
- Publishes to all default relays
- Returns event ID on success
- See `/llm/project/tech-stack.md` for implementation

**Create `src/nostr/fetch.ts`:**
- `fetchPaste(docId): Promise<{ nonce, ciphertext } | null>`
- Queries relays for event with d-tag = docId
- Returns null if not found
- Extracts nonce + ciphertext from event content

### 3. Complete Write Flow

**Update `src/components/Editor.tsx`:**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encryptPaste } from '../crypto/encrypt';
import { publishPaste } from '../nostr/publish';
import { buildCapabilityUrl } from '../utils/url';

type State = 'idle' | 'encrypting' | 'publishing' | 'done' | 'error';

function Editor() {
  const [content, setContent] = useState('');
  const [state, setState] = useState<State>('idle');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!content.trim()) return;

    setState('encrypting');
    try {
      const { ciphertext, nonce, key, docId } = await encryptPaste(content);

      setState('publishing');
      await publishPaste(docId, nonce, ciphertext);

      const capabilityUrl = buildCapabilityUrl(docId, key);
      setUrl(capabilityUrl);
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }

  // Render based on state...
}
```

**Create `src/components/Share.tsx`:**
- Display capability URL
- Copy button with clipboard API
- "Copied!" confirmation feedback
- "Create New" button to reset
- Warning: "Anyone with this link can view the content"

### 4. Complete Read Flow

**Update `src/components/Reader.tsx`:**

```typescript
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchPaste } from '../nostr/fetch';
import { decryptPaste } from '../crypto/decrypt';
import { hexToKey } from '../crypto/keys';

type State = 'fetching' | 'decrypting' | 'done' | 'not_found' | 'decrypt_error';

function Reader() {
  const { docId } = useParams();
  const { hash } = useLocation();
  const [state, setState] = useState<State>('fetching');
  const [content, setContent] = useState('');

  useEffect(() => {
    async function load() {
      if (!docId || !hash) {
        setState('decrypt_error');
        return;
      }

      const keyHex = hash.slice(1); // remove #
      const key = hexToKey(keyHex);

      setState('fetching');
      const result = await fetchPaste(docId);

      if (!result) {
        setState('not_found');
        return;
      }

      setState('decrypting');
      try {
        const plaintext = await decryptPaste(result.ciphertext, result.nonce, key);
        setContent(plaintext);
        setState('done');
      } catch {
        setState('decrypt_error');
      }
    }

    load();
  }, [docId, hash]);

  // Render based on state...
}
```

### 5. Error Components

**Create `src/components/Error.tsx`:**
- Reusable error display component
- Different messages for different error types:
  - `not_found`: "This paste was not found."
  - `decrypt_error`: "Could not decrypt. The link may be incorrect."
  - `network_error`: "Could not connect to Nostr relays."
- "Try Again" and "Create New" buttons

### 6. Loading States

**Create `src/components/Loading.tsx`:**
- Simple spinner or loading indicator
- Status text: "Encrypting...", "Publishing...", "Fetching...", "Decrypting..."

### 7. Copy-to-Clipboard

**Create `src/utils/clipboard.ts`:**
```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
```

### 8. Styling

**Apply Tailwind classes for:**
- Responsive layout (mobile-first)
- Dark/light mode (optional, basic)
- Textarea with good UX
- Buttons with hover/active states
- Error states with appropriate colors
- Loading states

**Example Editor styling:**
```tsx
<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
  <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold mb-4">Noslock</h1>
    <textarea
      className="w-full h-64 border rounded p-3 resize-none"
      placeholder="Enter text to encrypt..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
    <button
      className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      onClick={handleCreate}
      disabled={state !== 'idle'}
    >
      {state === 'idle' ? 'Create Paste' : 'Creating...'}
    </button>
  </div>
</div>
```

### 9. Integration Testing

**Test scenarios:**

| Scenario | Expected Result |
|----------|-----------------|
| Create paste with short text | Success, URL displayed |
| Create paste with long text (~50KB) | Success, URL displayed |
| Open valid URL | Content decrypted and displayed |
| Open URL with wrong key | "Decryption failed" error |
| Open URL for non-existent paste | "Not found" error |
| Network failure during publish | Error message, retry option |

**Manual testing flow:**
1. Start dev server
2. Enter text, click Create
3. Verify URL appears
4. Open URL in new tab
5. Verify content displays
6. Test with wrong key (modify URL fragment)
7. Test with non-existent docId

## Exit Criteria

| Criterion | Verification |
|-----------|--------------|
| Write flow works | Create paste -> get URL |
| Read flow works | Open URL -> see content |
| Cross-relay works | Publish to 3, read from any |
| Error handling | Graceful failures with messages |
| Copy works | Clipboard copies URL |
| Mobile layout | Usable on phone screen |

## Deliverables

After this phase:
- Fully functional encrypted pastebin
- Works with real Nostr relays
- Error handling for common cases
- Copy-to-clipboard sharing
- Mobile-responsive design
- Ready for deployment
