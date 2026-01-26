import { Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Editor } from "./components/Editor";
import { Reader } from "./components/Reader";
import { Share } from "./components/Share";
import { LinkReader } from "./components/LinkReader";
import sodium from "libsodium-wrappers";
import { publishPaste } from "./nostr/publish";
import { buildCapabilityUrl } from "./utils/url";

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

function DocIdRoute({
  stateDocId,
  capabilityUrl,
}: {
  stateDocId: string | null;
  capabilityUrl: string | null;
}) {
  const { docId: urlDocId } = useParams<{ docId: string }>();

  // Only show Share if state docId matches URL docId (user just created this paste)
  if (stateDocId && capabilityUrl && stateDocId === urlDocId) {
    return <Share docId={stateDocId} capabilityUrl={capabilityUrl} />;
  }
  return <Reader />;
}

function App() {
  const [docId, setDocId] = useState<string | null>(null);
  const [capabilityUrl, setCapabilityUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEncrypt = async (
    id: string,
    encryptionKey: Uint8Array,
    cipher: Uint8Array,
    non: Uint8Array,
  ) => {
    console.log("📝 App: Received encrypted data from Editor");
    console.log("🔗 Document ID:", id);

    // Generate capability URL immediately (key used locally, not stored in state)
    const capUrl = buildCapabilityUrl(id, encryptionKey);
    setDocId(id);
    setCapabilityUrl(capUrl);

    // Publish to nostr
    console.log("📦 App: Publishing paste to nostr relays...");
    try {
      await publishPaste(id, non, cipher);

      // Navigate to share page with key hash only on successful publish
      const keyHex = sodium.to_hex(encryptionKey);
      if (!window.location.pathname.startsWith(`/${id}`)) {
        console.log("🧭 App: Navigating to share URL:", `/${id}#${keyHex}`);
        navigate(`/${id}#${keyHex}`);
      }
    } catch (err) {
      console.error(err);
      return;
    }
  };

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
            element={<DocIdRoute stateDocId={docId} capabilityUrl={capabilityUrl} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
