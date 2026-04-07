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
    <div className={`prose prose-invert prose-headings:text-surface-50 prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-strong:text-surface-100 prose-code:text-primary-300 prose-blockquote:border-primary-500 max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, emoji]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-surface-50" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 text-surface-50 flex items-center gap-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-2 text-surface-100" {...props} />,
          a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 hover:underline" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="text-surface-300" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 text-surface-300" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-500 pl-4 italic text-surface-400" {...props} />,
          code: ({node, inline, className, children, ...props}: any) => 
            inline ? 
              <code className="bg-surface-700 px-1.5 py-0.5 rounded text-primary-300 text-sm" {...props}>{children}</code> :
              <pre className="bg-surface-700 p-4 rounded-md overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}