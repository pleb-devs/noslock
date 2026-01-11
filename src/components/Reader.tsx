import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { parseCapabilityUrl } from "@/utils/url";

export function Reader() {
  const { docId } = useParams<{ docId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;
    const fullUrl = window.location.href;

    const handleParse = () => {
      try {
        const parsed = parseCapabilityUrl(fullUrl);
        console.log("Parsed URL:", parsed);
        // Future: set state with parsed data
      } catch (err) {
        setError("Invalid capability URL");
        console.error("URL parsing failed:", err);
      }
    };

    handleParse();
  }, [docId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="font-mono text-lg text-neutral-100 mb-4">Reading Paste</h2>

        {error ? (
          <div className="border border-red-900 bg-red-950/50 rounded p-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        ) : (
          <div>
            <p className="text-neutral-500 font-mono text-sm mb-2">
              // document ID: {docId}
            </p>
            <p className="text-neutral-500 font-mono text-sm mb-4">
              // parsing capability URL...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
