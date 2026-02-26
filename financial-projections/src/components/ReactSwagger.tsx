'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

type Props = {
  spec: Record<string, unknown>;
};

/**
 * Pure Swagger UI renderer. Receives the spec object as a prop.
 * All loading/error/generation states are handled by the parent component.
 */
export default function ReactSwagger({ spec }: Props) {
  const initializedRef = useRef(false);
  const scriptReadyRef = useRef(false);
  const specRef = useRef(spec);
  specRef.current = spec;

  function initSwagger() {
    if (initializedRef.current) {
      // Re-initialize with new spec
      window.SwaggerUIBundle({
        spec: specRef.current,
        dom_id: '#swagger-ui',
      });
      return;
    }
    initializedRef.current = true;
    window.SwaggerUIBundle({
      spec: specRef.current,
      dom_id: '#swagger-ui',
    });
  }

  // Initialize when script is already loaded and spec changes
  useEffect(() => {
    if (scriptReadyRef.current) {
      initSwagger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  function onScriptLoad() {
    scriptReadyRef.current = true;
    initSwagger();
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
      <div id="swagger-ui" />
    </>
  );
}

declare global {
  interface Window {
    SwaggerUIBundle: (config: Record<string, unknown>) => void;
  }
}
