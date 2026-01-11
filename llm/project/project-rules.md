Purpose: Coding standards and engineering conventions for Noslock.

# Noslock Project Rules

## Language & Runtime

- **Language**: TypeScript (strict mode)
- **Runtime**: Browser (ES2020+)
- **Node**: 20+ for tooling
- **Package Manager**: npm

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx"
  }
}
```

### Type Rules
- No `any` types - use `unknown` and narrow
- Explicit return types on exported functions
- Interface over type for object shapes
- Use `readonly` where mutation isn't needed

## Project Structure

```
noslock/
├── src/
│   ├── components/       # React components
│   │   ├── Editor.tsx
│   │   ├── Reader.tsx
│   │   ├── Share.tsx
│   │   └── ui/           # Reusable UI primitives
│   ├── crypto/           # Encryption logic
│   │   ├── encrypt.ts
│   │   ├── decrypt.ts
│   │   └── keys.ts
│   ├── nostr/            # Relay communication
│   │   ├── client.ts
│   │   ├── publish.ts
│   │   └── fetch.ts
│   ├── utils/            # Shared utilities
│   │   ├── url.ts
│   │   └── clipboard.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── llm/                  # Documentation (this folder)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase.tsx | `Editor.tsx` |
| Files (utilities) | camelCase.ts | `clipboard.ts` |
| Files (tests) | *.test.ts | `encrypt.test.ts` |
| Components | PascalCase | `Editor`, `ShareScreen` |
| Functions | camelCase | `encryptPaste`, `fetchPaste` |
| Constants | SCREAMING_SNAKE | `DEFAULT_RELAYS` |
| Types/Interfaces | PascalCase | `EncryptedPaste` |
| CSS classes | kebab-case | via Tailwind |

## Code Style

### Formatting
- Prettier with defaults
- 2 space indentation
- Single quotes for strings
- No semicolons (Prettier default)
- Trailing commas in multiline

### Imports
```typescript
// 1. React/external
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// 2. Internal absolute
import { encryptPaste } from '@/crypto/encrypt'

// 3. Relative
import { Button } from './ui/Button'

// 4. Types (if separate)
import type { EncryptedPaste } from '@/crypto/types'
```

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react'

// 2. Types
interface EditorProps {
  onSubmit: (content: string) => void
}

// 3. Component
export function Editor({ onSubmit }: EditorProps) {
  // State
  const [content, setContent] = useState('')

  // Handlers
  function handleSubmit() {
    onSubmit(content)
  }

  // Render
  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleSubmit}>[create]</button>
    </div>
  )
}
```

### Function Components Only
- No class components
- Use hooks for state and effects
- Keep components small and focused

## Error Handling

### Crypto Errors
```typescript
// Throw specific errors
export class DecryptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DecryptionError'
  }
}

// Catch and handle
try {
  const plaintext = await decryptPaste(ciphertext, nonce, key)
} catch (error) {
  if (error instanceof DecryptionError) {
    // Handle decryption failure
  }
  throw error
}
```

### Network Errors
- Retry failed relay connections (3 attempts)
- Timeout after 5 seconds per relay
- Provide user-friendly messages

### Never Swallow Errors
```typescript
// Bad
try { await something() } catch {}

// Good
try {
  await something()
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}
```

## Async Patterns

### Use async/await
```typescript
// Good
async function fetchPaste(docId: string) {
  const client = new Nostr(DEFAULT_RELAYS)
  await client.connectToRelays()
  const event = await client.fetchOne([{ kinds: [30078], '#d': [docId] }])
  return event
}

// Avoid raw promises unless necessary
```

### Handle Loading States
```typescript
type State = 'idle' | 'loading' | 'success' | 'error'

const [state, setState] = useState<State>('idle')

async function handleAction() {
  setState('loading')
  try {
    await doThing()
    setState('success')
  } catch {
    setState('error')
  }
}
```

## Security Rules

### Cryptographic Data
- Never log keys, nonces, or plaintext
- Clear sensitive data from memory when done (where possible)
- Use `Uint8Array` for binary data, not strings

### URL Fragment
- Key MUST stay in fragment (`#`)
- Never include key in path or query params
- Validate key format before use

### Input Validation
```typescript
function parseCapabilityUrl(url: string): { docId: string; key: Uint8Array } {
  // Validate URL format
  if (!url.includes('#')) {
    throw new Error('Invalid URL: missing key fragment')
  }

  const keyHex = url.split('#')[1]

  // Validate key length (32 bytes = 64 hex chars)
  if (keyHex.length !== 64) {
    throw new Error('Invalid key length')
  }

  // Validate hex format
  if (!/^[a-f0-9]+$/i.test(keyHex)) {
    throw new Error('Invalid key format')
  }

  return { docId, key: hexToKey(keyHex) }
}
```

## Testing

### Test Files
- Co-locate with source: `encrypt.test.ts` next to `encrypt.ts`
- Or use `__tests__` folder in each module

### Testing Library
- Vitest for unit tests
- React Testing Library for components

### What to Test
| Module | Test Focus |
|--------|------------|
| crypto | Round-trip, edge cases, invalid inputs |
| url | Parsing, building, validation |
| nostr | Mock relay responses |
| components | User interactions, state changes |

### Example Test
```typescript
import { describe, it, expect } from 'vitest'
import { encryptPaste } from './encrypt'
import { decryptPaste } from './decrypt'

describe('crypto', () => {
  it('round-trips correctly', async () => {
    const plaintext = 'Hello, Noslock!'
    const { ciphertext, nonce, key } = await encryptPaste(plaintext)
    const decrypted = await decryptPaste(ciphertext, nonce, key)
    expect(decrypted).toBe(plaintext)
  })

  it('fails with wrong key', async () => {
    const { ciphertext, nonce } = await encryptPaste('secret')
    const wrongKey = new Uint8Array(32)
    await expect(decryptPaste(ciphertext, nonce, wrongKey)).rejects.toThrow()
  })
})
```

## Git Conventions

### Branch Names
- `main` - production-ready
- `feat/description` - new feature
- `fix/description` - bug fix
- `refactor/description` - code refactor

### Commit Messages
```
type: short description

Optional longer description.
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Examples
```
feat: add copy-to-clipboard functionality
fix: handle relay timeout gracefully
refactor: extract url parsing to utility
docs: update tech-stack with event structure
```

## Dependencies

### Allowed
| Package | Purpose |
|---------|---------|
| react, react-dom | UI framework |
| react-router-dom | Routing |
| libsodium-wrappers | Crypto |
| snstr | Nostr relays |
| tailwindcss | Styling |

### Dev Dependencies
| Package | Purpose |
|---------|---------|
| vite | Build tool |
| typescript | Type checking |
| vitest | Testing |
| prettier | Formatting |
| eslint | Linting |

### Adding Dependencies
- Justify the need
- Check bundle size impact
- Prefer well-maintained packages
- No dependencies with native bindings

## Performance

### Bundle Size
- Target: < 150KB gzipped
- Monitor with `vite-bundle-visualizer`
- Lazy load routes if needed (not for MVP)

### Rendering
- Avoid unnecessary re-renders
- Memoize expensive computations
- Keep component tree shallow

## Documentation

### Code Comments
- Explain "why", not "what"
- Document non-obvious security considerations
- Use JSDoc for exported functions

```typescript
/**
 * Encrypts plaintext using XChaCha20-Poly1305.
 * Generates random key and nonce for each call.
 *
 * @param plaintext - UTF-8 text to encrypt
 * @returns Encrypted data with key for capability URL
 */
export async function encryptPaste(plaintext: string): Promise<EncryptedPaste> {
  // ...
}
```

### README
- Keep project README minimal
- Point to `llm/` for detailed docs
- Include quick start only
