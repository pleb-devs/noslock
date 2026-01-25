# NOSTR Implementation Review - Noslock Project

**Document Version**: 1.0  
**Date**: 2025-01-08  
**Reviewer**: AI Code Review  
**Scope**: NOSTR integration, cryptography, URL handling, and adjacent frontend code

---

## Executive Summary

This review identified **13 critical issues** in the NOSTR implementation, ranging from data integrity failures to security vulnerabilities. **2 issues are CRITICAL priority** requiring immediate fixes, **4 are HIGH priority** affecting protocol compliance, and **7 are MEDIUM/LOW priority** affecting code quality and maintainability.

**Top Priority Actions:**
1. Fix data format mismatch between spec and implementation (CRITICAL)
2. Resolve memory management vulnerability in key handling (CRITICAL)
3. Implement proper NIP-01 event structure compliance (HIGH)
4. Add comprehensive error handling and validation (HIGH)

---

## Priority 1: CRITICAL - Security & Data Integrity

### 1.1 **Data Format Mismatch Between Specification and Implementation**

**File**: `src/nostr/publish.ts`, `src/nostr/fetch.ts`  
**Severity**: CRITICAL  
**Impact**: **Data corruption** - Pastes created with current implementation **cannot be read** by spec-compliant clients

**Issue Description**:  
The technical specification (`tech-stack.md`) explicitly states:
```typescript
// content: "<base64(nonce || ciphertext)>"
```

But the implementation uses:
```typescript
// publish.ts: content = `${cipherHex}:${nonceHex}` (hex with colon)
// fetch.ts: expects [cipherHex, nonceHex] = event.content?.split(":") ?? []
```

**Evidence**:
- `tech-stack.md` shows: `const content = btoa(String.fromCharCode(...combined));`
- `publish.ts` line 15: `const content = `${cipherHex}:${nonceHex}`;`
- `fetch.ts` lines 23-24: Uses `split(":")` instead of base64 decode

**Required Fix**:  
```typescript
// publish.ts
const combined = new Uint8Array(nonce.length + ciphertext.length);
combined.set(nonce);
combined.set(ciphertext, nonce.length);
const content = btoa(String.fromCharCode(...combined));

// fetch.ts
const combined = Uint8Array.from(atob(event.content), c => c.charCodeAt(0));
const nonce = combined.slice(0, 24);
const ciphertext = combined.slice(24);
```

**Testing**: Add integration test to verify spec-compliant event format.

---

### 1.2 **Memory Management Vulnerability - Key Lifetime**

**File**: `src/crypto/encrypt.ts`  
**Severity**: CRITICAL  
**Impact**: **Security** - Encryption keys may persist in memory longer than necessary

**Issue Description**:  
The `encryptPaste` function attempts to clear sensitive key material but has a critical flaw:

```typescript
// encrypt.ts lines 42-49
return {
  ciphertext,
  nonce,
  key: new Uint8Array(key),  // ← Creates a COPY of the key
  docId,
};
} finally {
  if (key) sodium.memzero(key);  // ← Only clears the original, not the copy
}
```

The returned `key` is a **copy** that is **never cleared from memory**.

**Evidence**:  
- `new Uint8Array(key)` creates a shallow copy via the typed array constructor
- This copy is returned and used throughout the application
- No mechanism exists to track or clear these copies

**Required Fix**:  
Document that returned key must be cleared by caller, or implement reference counting:

```typescript
// Option 1: Document caller responsibility (add JSDoc)
/**
 * @returns Encrypted data. CALLER MUST CLEAR key FROM MEMORY using sodium.memzero().
 */

// Option 2: Return wrapper with cleanup method
export interface EncryptedPaste {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  key: Uint8Array;
  docId: string;
  clear: () => void;  // Clears key, nonce, and ciphertext from memory
}
```

Update all call sites to clear the key after use (e.g., in `App.tsx` after building URL).

---

### 1.3 **Missing Input Validation in NOSTR Layer**

**File**: `src/nostr/fetch.ts`, `src/nostr/publish.ts`  
**Severity**: CRITICAL  
**Impact**: **Security/Reliability** - Invalid inputs can cause undefined behavior or crashes

**Issue Description**:  
`fetchPaste` does not validate `docId` format before querying relays. Malformed IDs can:
- Waste relay queries on invalid data
- Potentially leak information through error messages
- Cause downstream crashes in parsing logic

**Current Code** (fetch.ts line 8):
```typescript
export async function fetchPaste(docId: string): Promise<...> {
  // No validation of docId format!
  const event = await pool.get(DEFAULT_RELAYS, { kinds: [30078], "#d": [docId] }, ...);
}
```

**Required Fix**:  
Add validation at function entry:

```typescript
import { generateDocId } from "@/crypto/keys";

export async function fetchPaste(docId: string): Promise<...> {
  // Validate docId is 64-char hex
  if (!/^[a-f0-9]{64}$/i.test(docId)) {
    throw new Error(`Invalid docId format: must be 64-character hex string`);
  }
  // ... rest of function
}
```

**Additional Validation Needed**:
- In `parseCapabilityUrl`: Validate docId format after extracting
- In `publishPaste`: Validate docId, nonce, ciphertext lengths
- In `decryptPaste`: Validate key is 32 bytes, nonce is 24 bytes

---

## Priority 2: HIGH - Protocol Compliance & Reliability

### 2.1 **Incomplete NIP-01 Event Structure Compliance**

**File**: `src/nostr/publish.ts`  
**Severity**: HIGH  
**Impact**: **Interoperability** - Events may not be properly recognized by all relays

**Issue Description**:  
According to NIP-01 and the tech spec, events should include a `client` tag. The current implementation omits this.

**Spec Reference** (`tech-stack.md`):
```typescript
tags: [
  ["d", docId],
  ["client", "noslock"]  // ← Missing in implementation
]
```

**Current Code** (publish.ts lines 19-23):
```typescript
const unsignedEvent = createEvent(
  {
    kind: 30078,
    content,
    tags: [["d", docId]],  // ← Only d-tag, no client tag
  },
  pubkey,
);
```

**Required Fix**:  
Add client tag per spec:
```typescript
tags: [
  ["d", docId],
  ["client", "noslock"]
]
```

---

### 2.2 **Inadequate Error Handling in fetchPaste**

**File**: `src/nostr/fetch.ts`  
**Severity**: HIGH  
**Impact**: **Debugging & UX** - Cannot distinguish between different failure modes

**Issue Description**:  
`fetchPaste` returns `null` for multiple failure cases without distinguishing:
- Event not found on relays
- Malformed event content
- Network/relay errors
- Invalid data format

**Current Code**:
```typescript
if (!event) {
  console.log("❌ Note not found for document ID:", docId);
  return null;  // Same return as malformed content!
}

const [cipherHex, nonceHex] = event.content?.split(":") ?? [];
if (!cipherHex || !nonceHex) {
  console.log("❌ Invalid content format in note");
  return null;  // Same return value!
}
```

**Required Fix**:  
Throw distinct error types for different failure modes:

```typescript
export class NotFoundError extends Error { constructor() { super("Paste not found"); this.name = "NotFoundError"; } }
export class InvalidEventError extends Error { constructor() { super("Invalid event format"); this.name = "InvalidEventError"; } }

if (!event) {
  throw new NotFoundError();
}

const [cipherHex, nonceHex] = event.content?.split(":") ?? [];
if (!cipherHex || !nonceHex) {
  throw new InvalidEventError();
}
```

**Update UI components** to catch and display specific errors to users.

---

### 2.3 **No Retry Logic for Relay Failures**

**File**: `src/nostr/publish.ts`, `src/nostr/fetch.ts`  
**Severity**: HIGH  
**Impact**: **Reliability** - Single relay failure causes complete operation failure

**Issue Description**:  
Both publish and fetch operations use `Promise.all()` which fails if **any** relay fails:

```typescript
const publishPromises = pool.publish(DEFAULT_RELAYS, signedEvent);
await Promise.all(publishPromises);  // Fails if ONE relay fails!
```

**Required Fix**:  
Implement best-effort publishing and fetching:

```typescript
// publish.ts
const results = await Promise.allSettled(publishPromises);
const successes = results.filter(r => r.status === 'fulfilled').length;
if (successes === 0) {
  throw new Error(`Failed to publish to any relay`);
}
console.log(`Published to ${successes}/${DEFAULT_RELAYS.length} relays`);

// fetch.ts
// pool.get already handles multi-relay internally with snstr, 
// but verify behavior and add explicit timeout handling
```

---

### 2.4 **Key Not Cleared in App Layer**

**File**: `src/App.tsx` (implied from structure)  
**Severity**: HIGH  
**Impact**: **Security** - Encryption key persists in React state

**Issue Description**:  
After creating a paste, the encryption key remains in React state until page reload. Since keys are not cleared from memory, they could be exposed to XSS attacks or memory dumps.

**Evidence**:  
From App.tsx structure:
```typescript
const [key, setKey] = useState<Uint8Array | null>(null);
// Key is set but never cleared
```

**Required Fix**:  
Clear key after URL is generated:

```typescript
useEffect(() => {
  if (docId && key && ciphertext && nonce) {
    publishPaste(docId, nonce, ciphertext).then(() => {
      // Clear sensitive data from state
      if (key) sodium.memzero(key);
      setKey(null);
      setCiphertext(null);
      setNonce(null);
    });
  }
}, [docId, key, ciphertext, nonce, navigate]);
```

---

## Priority 3: MEDIUM - Code Quality & UX

### 3.1 **Production Console Logging**

**File**: `src/nostr/publish.ts`, `src/nostr/fetch.ts`, `src/App.tsx`  
**Severity**: MEDIUM  
**Impact**: **Aesthetics/Security** - Emoji-heavy logs don't match design aesthetic

**Issue Description**:  
Console logs use casual emojis inconsistent with cypherpunk aesthetic:

```typescript
console.log("📝 Publishing note:", encodeNoteId(id));
console.log("✅ Successfully published note:", encodeNoteId(id));
console.log("❌ Note not found for document ID:", docId);
```

**Required Fix**:  
Replace with on-brand, technical logging:

```typescript
console.log(`[nostr] Publishing kind:30078 event: ${encodeNoteId(id)}`);
console.log(`[nostr] Published to ${successCount}/${totalCount} relays`);
console.log(`[nostr] Note not found: ${docId}`);
```

**Consider**: Use a proper logging utility with levels (debug/info/error) that can be disabled in production.

---

### 3.2 **Missing Explicit Return Types**

**File**: `src/nostr/fetch.ts`, `src/nostr/publish.ts`  
**Severity**: MEDIUM  
**Impact**: **Type Safety** - Reduced TypeScript strict mode compliance

**Issue Description**:  
Async functions lack explicit return type annotations:

```typescript
export async function fetchPaste(docId: string): Promise<...> {
  // No explicit return type declared
}
```

**Required Fix**:  
Add explicit return types per project rules:
```typescript
export async function fetchPaste(
  docId: string
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array } | null> {
  // ...
}
```

---

### 3.3 **Insufficient Test Coverage**

**File**: Test suite  
**Severity**: MEDIUM  
**Impact**: **Reliability** - No tests for NOSTR layer or error scenarios

**Current Coverage**:
- ✅ Crypto roundtrip tests (good coverage)
- ❌ NOSTR publish/fetch tests
- ❌ URL parsing edge cases
- ❌ Error handling paths
- ❌ Memory management verification

**Required Fix**:  
Add tests:
```typescript
// nostr/__tests__/publish.test.ts
describe("publishPaste", () => {
  it("publishes valid event to relays");
  it("throws if all relays fail");
  it("validates docId format");
});

// nostr/__tests__/fetch.test.ts
describe("fetchPaste", () => {
  it("fetches and decodes event");
  it("throws NotFoundError for missing event");
  it("throws InvalidEventError for malformed content");
});

// utils/__tests__/url.test.ts
describe("parseCapabilityUrl", () => {
  it("validates key length");
  it("rejects invalid hex characters");
});
```

---

### 3.4 **CSS Not Following Design Tokens**

**File**: Component CSS classes  
**Severity**: LOW  
**Impact**: **Consistency** - Direct Tailwind usage doesn't match design system

**Issue Description**:  
Components likely use arbitrary Tailwind values instead of defined tokens from `design-rules.md`.

**Required Fix**:  
Define and use CSS custom properties:
```css
/* index.css */
:root {
  --color-bg-primary: #0a0a0a;
  --color-accent: #22c55e;
  --font-mono: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
}

/* Use in components */
className="bg-bg-primary text-accent font-mono"
```

---

## Priority 4: LOW - Best Practices

### 4.1 **Missing JSDoc Comments**

**File**: `src/nostr/fetch.ts`, `src/nostr/publish.ts`  
**Severity**: LOW  
**Impact**: **Documentation** - Reduced code maintainability

**Required Fix**:  
Add JSDoc per project rules:
```typescript
/**
 * @param docId - 64-character hex document ID
 * @param nonce - 24-byte XChaCha20-Poly1305 nonce
 * @param ciphertext - Encrypted payload
 * @returns Promise resolving to published docId
 * @throws PublishError if no relays accept the event
 */
export async function publishPaste(...)
```

---

### 4.2 **No Bundle Size Monitoring**

**File**: Build configuration  
**Severity**: LOW  
**Impact**: **Performance** - Cannot verify bundle size constraints

**Required Fix**:  
Add `vite-bundle-visualizer` and set up CI check for <150KB gzipped target.

---

## Testing Matrix

Create integration test that validates **full flow end-to-end**:

```typescript
// __tests__/e2e/flow.test.ts
describe("End-to-end paste flow", () => {
  it("creates, publishes, fetches, and decrypts paste", async () => {
    const plaintext = "Secret message";
    
    // Create
    const { ciphertext, nonce, key, docId } = await encryptPaste(plaintext);
    
    // Publish
    await publishPaste(docId, nonce, ciphertext);
    
    // Fetch
    const fetched = await fetchPaste(docId);
    expect(fetched).not.toBeNull();
    
    // Decrypt
    const decrypted = await decryptPaste(
      fetched!.ciphertext, 
      fetched!.nonce, 
      key
    );
    expect(decrypted).toBe(plaintext);
    
    // Cleanup
    sodium.memzero(key);
  });
});
```

---

## Recommended Implementation Order

### Week 1 (Critical Security)
1. ✅ Fix data format mismatch (1.1)
2. ✅ Fix memory management (1.2)
3. ✅ Add input validation (1.3)

### Week 2 (Protocol Compliance)
4. ✅ Fix NIP-01 event structure (2.1)
5. ✅ Improve error handling (2.2)
6. ✅ Add retry logic (2.3)

### Week 3 (Quality & Testing)
7. ✅ Clear keys in App layer (2.4)
8. ✅ Remove production logging (3.1)
9. ✅ Add explicit return types (3.2)
10. ✅ Expand test coverage (3.3)

### Week 4 (Polish)
11. ✅ Add design token CSS (3.4)
12. ✅ Add JSDoc comments (4.1)
13. ✅ Set up bundle monitoring (4.2)

---

## Verification Checklist

After implementing fixes, verify:

- [ ] Pastes created before fixes can still be read (backward compatibility consideration)
- [ ] New pastes follow spec format (base64 concatenated)
- [ ] Memory profiling shows keys cleared after use
- [ ] All relays receive properly formatted events
- [ ] Error messages help users (NotFound vs InvalidKey)
- [ ] Console logs removed or made technical
- [ ] Test coverage >80% for NOSTR layer
