import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { Share } from "./components/Share";
import { Reader } from "./components/Reader";
import { LinkReader } from "./components/LinkReader";
import { publishPaste } from "./nostr/publish";

function Home({
  onEncrypt,
}: {
  onEncrypt: (
    id: string,
    key: Uint8Array,
    cipher: Uint8Array,
    nonce: Uint8Array,
  ) => void;
}) {
  const [mode, setMode] = useState<"create" | "read">("create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setMode("create")}
          className={`font-mono text-sm uppercase tracking-wider transition-colors ${
            mode === "create"
              ? "text-green-400"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          [create]
        </button>
        <button
          onClick={() => setMode("read")}
          className={`font-mono text-sm uppercase tracking-wider transition-colors ${
            mode === "read"
              ? "text-green-400"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          [read]
        </button>
      </div>

      {mode === "create" ? <Editor onEncrypt={onEncrypt} /> : <LinkReader />}
    </div>
  );
}

function App() {
  const [docId, setDocId] = useState<string | null>(null);
  const [key, setKey] = useState<Uint8Array | null>(null);
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null);
  const [nonce, setNonce] = useState<Uint8Array | null>(null);
  const navigate = useNavigate();

  const handleEncrypt = (
    id: string,
    encryptionKey: Uint8Array,
    cipher: Uint8Array,
    non: Uint8Array,
  ) => {
    console.log("📝 App: Received encrypted data from Editor");
    console.log("🔗 Document ID:", id);
    setDocId(id);
    setKey(encryptionKey);
    setCiphertext(cipher);
    setNonce(non);
  };

  useEffect(() => {
    if (docId && key && ciphertext && nonce) {
      console.log("📦 App: Publishing paste to nostr relays...");
      console.log("🔗 Document ID:", docId);
      publishPaste(docId, nonce, ciphertext).catch(console.error);
      if (!window.location.pathname.startsWith(`/${docId}`)) {
        console.log("🧭 App: Navigating to share URL:", `/${docId}`);
        navigate(`/${docId}`);
      }
    }
  }, [docId, key, ciphertext, nonce, navigate]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-mono">
      <header className="py-4 px-4 border-b border-neutral-800">
        <Link
          to="/"
          className="font-mono text-lg text-neutral-100 tracking-wide hover:text-green-400 transition-colors"
        >
          noslock<span className="text-green-500">_</span>
        </Link>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home onEncrypt={handleEncrypt} />} />
          <Route
            path="/:docId"
            element={
              docId && key ? (
                <Share docId={docId} encryptionKey={key!} />
              ) : (
                <Reader />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
