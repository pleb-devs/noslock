import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Editor } from "./components/Editor";
import { Share } from "./components/Share";
import { Reader } from "./components/Reader";

function App() {
  const [docId, setDocId] = useState<string | null>(null);
  const [key, setKey] = useState<Uint8Array | null>(null);

  const handleEncrypt = (id: string, encryptionKey: Uint8Array) => {
    setDocId(id);
    setKey(encryptionKey);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-mono">
        <header className="py-4 px-4 border-b border-neutral-800">
          <h1 className="font-mono text-lg text-neutral-100 tracking-wide">
            noslock<span className="text-green-500">_</span>
          </h1>
        </header>

        <main className="max-w-xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Editor onEncrypt={handleEncrypt} />} />
            <Route
              path="/:docId"
              element={
                docId && key ? <Share docId={docId} encryptionKey={key!} /> : <Reader />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
