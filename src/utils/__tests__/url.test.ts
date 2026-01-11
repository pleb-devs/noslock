import { describe, it, expect } from 'vitest';
import { buildCapabilityUrl, parseCapabilityUrl } from '../url';

describe('url utilities', () => {
  it('builds and parses capability URL correctly', () => {
    const docId = 'a'.repeat(64); // 64-character hex string
    const key = new Uint8Array(32).fill(0x12); // 32-byte key filled with 0x12

    const url = buildCapabilityUrl(docId, key);
    const parsed = parseCapabilityUrl(url);

    expect(parsed.docId).toBe(docId);
    expect(parsed.key).toEqual(key);
  });
});
