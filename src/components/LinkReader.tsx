import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseCapabilityUrl } from "../utils/url";
import sodium from "libsodium-wrappers";

export function LinkReader() {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRead() {
    if (!link.trim()) return;

    try {
      console.log("🔗 Parsing capability URL:", link.trim());
      await sodium.ready;
      const { docId, key } = parseCapabilityUrl(link.trim());
      console.log("✅ Parsed document ID:", docId);
      console.log("🔑 Parsed encryption key:", key);
      const keyHex = sodium.to_hex(key);
      console.log("🔐 Key as hex:", keyHex);
      navigate(`/${docId}#${keyHex}`);
    } catch (err) {
      console.error("❌ Failed to parse link:", err);
      setError("invalid link format");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <textarea
          className="w-full h-24 bg-neutral-900 text-neutral-100 font-mono text-sm p-4 rounded border border-neutral-800 focus:outline-none focus:border-green-500 placeholder-neutral-600 resize-none"
          placeholder="// paste noslock:// link here..."
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError("");
          }}
        />
      </div>

      {error && (
        <p className="text-red-400 font-mono text-sm">error: {error}</p>
      )}

      <button
        onClick={handleRead}
        disabled={!link.trim()}
        className="w-full bg-green-600 text-black font-mono text-sm py-3 px-4 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-colors"
      >
        [read]
      </button>
    </div>
  );
}
