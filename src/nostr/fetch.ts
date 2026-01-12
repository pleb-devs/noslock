import sodium from "libsodium-wrappers";
import { RelayPool, encodeNoteId } from "snstr";
import { DEFAULT_RELAYS } from "./client";

export async function fetchPaste(
  docId: string,
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array } | null> {
  console.log("🔍 Fetching note with document ID:", docId);

  const pool = new RelayPool(DEFAULT_RELAYS);
  try {
    const event = await pool.get(
      DEFAULT_RELAYS,
      { kinds: [30078], "#d": [docId] },
      { timeout: 5000 },
    );

    if (!event) {
      console.log("❌ Note not found for document ID:", docId);
      return null;
    }

    console.log("✅ Found note:", encodeNoteId(event.id));
    console.log("🔗 Document ID in note:", docId);

    const [cipherHex, nonceHex] = event.content?.split(":") ?? [];
    if (!cipherHex || !nonceHex) {
      console.log("❌ Invalid content format in note");
      return null;
    }

    console.log("📊 Retrieved encrypted data from note");

    return {
      ciphertext: sodium.from_hex(cipherHex),
      nonce: sodium.from_hex(nonceHex),
    };
  } finally {
    await pool.close();
  }
}
