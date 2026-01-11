import { useState } from "react";
import { encryptPaste } from "@/crypto/encrypt";

interface EditorProps {
  onEncrypt: (docId: string, key: Uint8Array) => void;
}

export function Editor({ onEncrypt }: EditorProps) {
  const [content, setContent] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleEncrypt = async () => {
    if (!content.trim()) return;

    setIsEncrypting(true);
    try {
      const { docId, key } = await encryptPaste(content);
      onEncrypt(docId, key);
    } catch (error) {
      console.error("Encryption failed:", error);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="// paste content here..."
          className="w-full h-80 bg-neutral-900 text-neutral-100 font-mono text-sm p-4 rounded border border-neutral-800 focus:outline-none focus:border-green-500 placeholder-neutral-600 resize-none"
        />
      </div>
      <button
        aria-busy={isEncrypting}
        onClick={handleEncrypt}
        disabled={isEncrypting || !content.trim()}
        className="w-full bg-green-600 text-black font-mono text-sm py-3 px-4 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-colors mt-4"
      >
        {isEncrypting ? "encrypting..." : "[create]"}
      </button>
    </div>
  );
}
