import { RelayPool } from "snstr";
import { DEFAULT_RELAYS } from "./client";
import { NotFoundError, InvalidEventError } from "./errors";

export async function fetchPaste(
  docId: string,
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array }> {
  // Validate docId is 64-char hex
  if (!/^[a-f0-9]{64}$/i.test(docId)) {
    throw new Error("Invalid docId format: must be 64-character hex string");
  }

  const pool = new RelayPool(DEFAULT_RELAYS);
  try {
    // Add timeout and retry handling for better reliability
    const event = await Promise.race([
      pool.get(
        DEFAULT_RELAYS,
        { kinds: [30078], "#d": [docId] },
        { timeout: 10000 },
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Relay fetch timeout")), 10000),
      ),
    ]);

    if (!event) {
      throw new NotFoundError();
    }

    // Decode base64 content
    let combined: Uint8Array;
    try {
      combined = Uint8Array.from(atob(event.content), (c) => c.charCodeAt(0));
    } catch {
      throw new InvalidEventError();
    }
    if (combined.length < 24) {
      throw new InvalidEventError();
    }

    // Split into nonce (24 bytes) and ciphertext
    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);

    return {
      nonce,
      ciphertext,
    };
  } finally {
    await pool.close();
  }
}
