import sodium from "libsodium-wrappers";

// Centralized libsodium initialization
export const cryptoReady = sodium.ready;

// Export all crypto functions with centralized initialization
export { encryptPaste } from "./encrypt";
export { decryptPaste, DecryptionError } from "./decrypt";
export { keyToHex, hexToKey, generateDocId } from "./keys";
