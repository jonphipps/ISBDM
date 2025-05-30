import React from 'react';
export default function CodeBlock({ children, language }) {
  return (
    <pre data-testid={`codeblock-${language || 'unknown'}`}>
      <code>{children}</code>
    </pre>
  );
} 