'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

type Props = {
  specUrl: string;
};

export default function ReactSwagger({ specUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize swagger-ui once the script has loaded and the container is ready
    if (typeof window !== 'undefined' && window.SwaggerUIBundle && !initializedRef.current) {
      initializedRef.current = true;
      window.SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
      });
    }
  }, [specUrl]);

  function onScriptLoad() {
    if (window.SwaggerUIBundle && !initializedRef.current) {
      initializedRef.current = true;
      window.SwaggerUIBundle({
        url: specUrl,
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
      <div id="swagger-ui" ref={containerRef} />
    </>
  );
}

declare global {
  interface Window {
    SwaggerUIBundle: (config: Record<string, unknown>) => void;
  }
}
