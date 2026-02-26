'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type Props = {
  specUrl: string;
};

export default function ReactSwagger({ specUrl }: Props) {
  const initializedRef = useRef(false);
  const scriptReadyRef = useRef(false);
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch the OpenAPI spec ourselves so we control the loading state
  useEffect(() => {
    let cancelled = false;

    async function fetchSpec() {
      try {
        const res = await fetch(specUrl);
        if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setSpec(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load API spec');
      }
    }

    fetchSpec();
    return () => { cancelled = true; };
  }, [specUrl]);

  // Initialize swagger-ui once both script and spec are ready
  useEffect(() => {
    if (spec && scriptReadyRef.current && !initializedRef.current) {
      initializedRef.current = true;
      window.SwaggerUIBundle({
        spec,
        dom_id: '#swagger-ui',
      });
    }
  }, [spec]);

  function onScriptLoad() {
    scriptReadyRef.current = true;
    if (spec && !initializedRef.current) {
      initializedRef.current = true;
      window.SwaggerUIBundle({
        spec,
        dom_id: '#swagger-ui',
      });
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        onLoad={onScriptLoad}
      />
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-600">
          <p className="text-lg font-medium">Failed to load API documentation</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : !spec ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">Compiling API docs&hellip;</p>
          <p className="mt-1 text-sm text-gray-500">This may take a moment</p>
        </div>
      ) : (
        <div id="swagger-ui" />
      )}
    </>
  );
}

declare global {
  interface Window {
    SwaggerUIBundle: (config: Record<string, unknown>) => void;
  }
}
