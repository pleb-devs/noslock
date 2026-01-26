import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { copyToClipboard } from "../utils/clipboard";

interface ShareProps {
  docId: string;
  capabilityUrl: string;
}

export function Share({ docId, capabilityUrl }: ShareProps) {
  const [isCopied, setIsCopied] = useState(false);
  // Extract key hex from capability URL for display
  const keyHex = capabilityUrl.split("#")[1] || "";

  // Prevent capability URL from appearing in browser history
  useEffect(() => {
    window.history.replaceState(null, "", `/${docId}`);
  }, [docId]);

  console.log("📤 Share component rendering");
  console.log("🔗 Document ID:", docId);

  const handleCopy = async () => {
    try {
      console.log("📋 Copying capability URL to clipboard: /", docId, "#[KEY REDACTED]");
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
          {docId}#{keyHex}
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
      <Link
        to="/"
        className="mt-4 block w-full border border-neutral-700 text-neutral-300 font-mono text-sm py-3 px-4 rounded hover:border-neutral-500 hover:text-neutral-100 transition-colors text-center uppercase tracking-wider"
      >
        [new]
      </Link>
    </div>
  );
}
