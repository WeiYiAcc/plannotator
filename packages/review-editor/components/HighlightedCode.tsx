import hljs from 'highlight.js';
import type React from 'react';
import { useEffect, useRef } from 'react';
import 'highlight.js/styles/github-dark.css';

/** Renders a single highlighted code element using highlight.js */
export const HighlightedCode: React.FC<{ code: string; language?: string }> = ({
  code,
  language,
}) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.className = language ? `language-${language}` : '';
      codeRef.current.textContent = code;
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return <code ref={codeRef}>{code}</code>;
};
