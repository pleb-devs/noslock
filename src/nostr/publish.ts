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

// Convert Uint8Array to base64 using chunked approach to avoid RangeError on large arrays
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 65535;
  let binaryStr = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binaryStr += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binaryStr);
}

export async function publishPaste(
  docId: string,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
): Promise<string> {
  // Combine nonce + ciphertext and base64 encode (as per documented format)
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  const content = uint8ArrayToBase64(combined);

  const keys = await generateKeypair();
  const pubkey = getPublicKey(keys.privateKey);

 const unsignedEvent = createEvent(
     {
       kind: 30078,
       content,
       tags: [
         ["d", docId],
         ["client", "noslock"],
       ],
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
    // Publish to all relays - pool.publish returns an array of promises
    const publishPromises = pool.publish(DEFAULT_RELAYS, signedEvent);

    // Wait for all publish attempts with timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Publish timeout")), 10000),
    );

    const results = await Promise.race([
      Promise.all(publishPromises),
      timeout,
    ]);

    // Check actual results from relays
    const successful = results.filter((r) => r.success).length;
    if (successful === 0) {
      const reasons = results.map((r) => r.reason).filter(Boolean).join(", ");
      throw new Error(`All relays failed to publish: ${reasons || "unknown error"}`);
    }
    console.log(
      `✅ Successfully published to ${successful} of ${DEFAULT_RELAYS.length} relays`,
    );
  } finally {
    await pool.close();
  }
  console.log("✅ Successfully published note:", encodeNoteId(id));
  return docId;
}
