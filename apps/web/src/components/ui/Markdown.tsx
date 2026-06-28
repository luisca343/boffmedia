'use client';

import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import emoji from 'remark-emoji';

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-invert prose-headings:text-ink prose-a:text-primary-hover hover:prose-a:text-primary-hover prose-strong:text-ink prose-code:text-primary-hover prose-blockquote:border-primary max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, emoji]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-ink" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 text-ink flex items-center gap-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-2 text-ink" {...props} />,
          a: ({node, ...props}) => <a className="text-primary-hover hover:text-primary-hover hover:underline" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="text-ink" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 text-ink" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-ink-muted" {...props} />,
          code: ({node, inline, className, children, ...props}: any) => 
            inline ? 
              <code className="bg-layer-3 px-1.5 py-0.5 rounded text-primary-hover text-sm" {...props}>{children}</code> :
              <pre className="bg-layer-3 p-4 rounded-md overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}