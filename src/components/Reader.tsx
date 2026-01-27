import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { fetchPaste } from "../nostr/fetch";
import { decryptPaste } from "../crypto/decrypt";
import { hexToKey } from "../crypto/keys";
import { NotFoundError, InvalidEventError } from "../nostr/errors";

export function Reader() {
  const { docId } = useParams<{ docId: string }>();
  const { hash } = useLocation();
  const [state, setState] = useState<
    "fetching" | "decrypting" | "done" | "not_found" | "decrypt_error" | "fetch_error"
  >("fetching");
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!docId || !hash) {
        setState("decrypt_error");
        return;
      }

      const keyHex = hash.slice(1);
      let key: Uint8Array;
      try {
        key = await hexToKey(keyHex);
      } catch {
        if (!cancelled) setState("decrypt_error");
        return;
      }
      if (!cancelled) setState("fetching");
      try {
        const result = await fetchPaste(docId);
        if (cancelled) return;
        setState("decrypting");
        try {
          const plaintext = await decryptPaste(
            result.ciphertext,
            result.nonce,
            key,
          );
          if (cancelled) return;
          setContent(plaintext);
          setState("done");
        } catch {
          if (!cancelled) setState("decrypt_error");
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof NotFoundError) {
          setState("not_found");
        } else if (error instanceof InvalidEventError) {
          setState("decrypt_error");
        } else {
          setState("fetch_error");
        }
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [docId, hash]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        {state === "done" && (
          <>
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 font-mono text-sm text-neutral-100 whitespace-pre-wrap">
              {content}
            </div>
            <Link
              to="/"
              className="mt-4 block w-full border border-neutral-700 text-neutral-300 font-mono text-sm py-3 px-4 rounded hover:border-neutral-500 hover:text-neutral-100 transition-colors text-center uppercase tracking-wider"
            >
              [new]
            </Link>
          </>
        )}
        {state === "fetching" && (
          <div className="flex items-center gap-3 text-neutral-400 font-mono text-sm">
            <span className="animate-pulse">_</span>
            fetching from relays...
          </div>
        )}
        {state === "decrypting" && (
          <div className="flex items-center gap-3 text-neutral-400 font-mono text-sm">
            <span className="animate-pulse">_</span>
            decrypting...
          </div>
        )}
        {state === "not_found" && (
          <div className="border border-red-900 bg-red-950/50 rounded p-4">
            <p className="text-red-400 font-mono text-sm">
              error: paste not found
            </p>
            <p className="text-neutral-500 font-mono text-xs mt-2">
              // this paste may not exist or has expired
            </p>
          </div>
        )}
        {state === "decrypt_error" && (
          <div className="border border-red-900 bg-red-950/50 rounded p-4">
            <p className="text-red-400 font-mono text-sm">
              error: decryption failed
            </p>
            <p className="text-neutral-500 font-mono text-xs mt-2">
              // key mismatch or corrupted data
            </p>
          </div>
        )}
        {state === "fetch_error" && (
          <div className="border border-red-900 bg-red-950/50 rounded p-4">
            <p className="text-red-400 font-mono text-sm">
              error: could not reach relays
            </p>
            <p className="text-neutral-500 font-mono text-xs mt-2">
              {"// network timeout or relay unavailable"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
