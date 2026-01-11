Purpose: Setup phase for Noslock - scaffold project and implement crypto primitives.

# Setup Phase

## Goals

- Scaffold Vite + React + TypeScript + Tailwind project
- Implement crypto module with libsodium.js
- Verify encrypt/decrypt round-trip works locally
- Build minimal UI shell
- **No relay integration yet**

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Project scaffold | Nostr relay integration |
| Crypto primitives | Publishing/fetching events |
| Local encrypt/decrypt | Production deployment |
| Basic UI components | Error handling polish |
| URL parsing utilities | Copy-to-clipboard |

## Steps

### 1. Project Scaffold

**Create Vite + React + TypeScript project:**
```bash
npm create vite@latest noslock -- --template react-ts
cd noslock
npm install
```

**Add Tailwind CSS:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Configure `tailwind.config.js`:**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**Add Tailwind to `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Add React Router:**
```bash
npm install react-router-dom
```

**Project structure:**
```
src/
├── components/
├── crypto/
├── nostr/      # Empty for now
├── utils/
├── App.tsx
└── main.tsx
```

### 2. Crypto Module

**Install libsodium-wrappers:**
```bash
npm install libsodium-wrappers
npm install -D @types/libsodium-wrappers
```

**Create `src/crypto/encrypt.ts`:**
- `encryptPaste(plaintext: string)` function
- Returns `{ ciphertext, nonce, key, docId }`
- Uses XChaCha20-Poly1305
- See `/llm/project/tech-stack.md` for implementation

**Create `src/crypto/decrypt.ts`:**
- `decryptPaste(ciphertext, nonce, key)` function
- Returns plaintext string
- Throws on decryption failure

**Create `src/crypto/keys.ts`:**
- `keyToHex(key: Uint8Array): string`
- `hexToKey(hex: string): Uint8Array`
- `generateDocId(): string`

### 3. URL Utilities

**Create `src/utils/url.ts`:**
- `buildCapabilityUrl(docId: string, key: Uint8Array): string`
- `parseCapabilityUrl(url: string): { docId: string, key: Uint8Array }`
- Handle both `noslock://` and `https://` protocols

### 4. Crypto Tests

**Create basic tests for encrypt/decrypt:**

```typescript
// src/crypto/__tests__/roundtrip.test.ts
import { encryptPaste } from '../encrypt';
import { decryptPaste } from '../decrypt';

test('encrypt/decrypt round-trip', async () => {
  const plaintext = 'Hello, Noslock!';
  const { ciphertext, nonce, key } = await encryptPaste(plaintext);
  const decrypted = await decryptPaste(ciphertext, nonce, key);
  expect(decrypted).toBe(plaintext);
});

test('wrong key fails decryption', async () => {
  const { ciphertext, nonce } = await encryptPaste('secret');
  const wrongKey = new Uint8Array(32); // all zeros
  await expect(decryptPaste(ciphertext, nonce, wrongKey)).rejects.toThrow();
});
```

**Add test runner:**
```bash
npm install -D vitest
```

### 5. Minimal UI

**Create `src/components/Editor.tsx`:**
- Textarea for entering content
- "Create" button (logs encrypted result for now)
- No styling yet, just functional

**Create `src/components/Share.tsx`:**
- Displays a capability URL (hardcoded for testing)
- No copy button yet

**Create `src/components/Reader.tsx`:**
- Placeholder that extracts docId/key from URL
- Logs parsed values to console

**Configure `src/App.tsx`:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import Reader from './components/Reader';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/:docId" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. Local Verification

**Manual testing checklist:**
1. `npm run dev` starts without errors
2. Editor renders with textarea and button
3. Clicking "Create" logs encrypted output to console
4. Navigating to `/:docId#keyHex` parses URL correctly
5. `npm test` passes crypto round-trip tests

## Exit Criteria

| Criterion | Verification |
|-----------|--------------|
| App runs locally | `npm run dev` starts without errors |
| Crypto works | Round-trip test passes |
| UI renders | Editor and Reader components load |
| URL parsing works | Fragment correctly extracted |
| Tests pass | `npm test` succeeds |

## Deliverables

After this phase:
- Working Vite + React + TypeScript project
- Crypto module with verified encrypt/decrypt
- URL utilities for capability URLs
- Basic UI shell with routing
- Ready for relay integration in MVP phase
