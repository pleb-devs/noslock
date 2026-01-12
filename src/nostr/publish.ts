import sodium from "libsodium-wrappers";
import {
  RelayPool,
  createEvent,
  generateKeypair,
  getPublicKey,
  signEvent,
  getEventHash,
  encodeNoteId,
} from "snstr";
import { DEFAULT_RELAYS } from "./client";

export async function publishPaste(
  docId: string,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
): Promise<string> {
  const nonceHex = sodium.to_hex(nonce);
  const cipherHex = sodium.to_hex(ciphertext);
  const content = `${cipherHex}:${nonceHex}`;

  const keys = await generateKeypair();
  const pubkey = getPublicKey(keys.privateKey);

  const unsignedEvent = createEvent(
    {
      kind: 30078,
      content,
      tags: [["d", docId]],
    },
    pubkey,
  );

  const id = await getEventHash(unsignedEvent);
  const sig = await signEvent(id, keys.privateKey);
  const signedEvent = { ...unsignedEvent, id, sig };

  console.log("📝 Publishing note:", encodeNoteId(id));
  console.log("🔗 Document ID:", docId);

  const pool = new RelayPool(DEFAULT_RELAYS);
  try {
    const publishPromises = pool.publish(DEFAULT_RELAYS, signedEvent);
    await Promise.all(publishPromises);
  } finally {
    await pool.close();
  }
  console.log("✅ Successfully published note:", encodeNoteId(id));
  return docId;
}
