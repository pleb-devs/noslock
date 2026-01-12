import { useState } from "react";
import { buildCapabilityUrl } from "../utils/url";
import { copyToClipboard } from "../utils/clipboard";

interface ShareProps {
  docId: string;
  encryptionKey: Uint8Array;
}

export function Share({ docId, encryptionKey }: ShareProps) {
  const [isCopied, setIsCopied] = useState(false);
  const capabilityUrl = buildCapabilityUrl(docId, encryptionKey);

  console.log("📤 Share component rendering");
  console.log("🔗 Document ID:", docId);
  console.log("🔑 Encryption Key (hex):", encryptionKey);

  const handleCopy = async () => {
    try {
      console.log("📋 Copying capability URL to clipboard:", capabilityUrl);
      await copyToClipboard(capabilityUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="font-mono text-lg text-neutral-100 mb-4">
          Paste Created!
        </h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4 font-mono text-sm text-green-400 break-all select-all mb-4">
          <span className="text-neutral-500">noslock://</span>
          {docId}#{keyToHex(encryptionKey)}
        </div>
        <p className="text-neutral-500 font-mono text-sm mb-4">
          Anyone with this link can view the content. Share carefully.
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="w-full bg-green-600 text-black font-mono text-sm py-3 px-4 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-colors mt-4"
      >
        {isCopied ? "copied_" : "[copy]"}
      </button>
    </div>
  );
}

// Helper to convert Uint8Array to hex string
function keyToHex(key: Uint8Array): string {
  return Array.from(key)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
