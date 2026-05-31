'use client';

import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

export function SanitizedHTML({ html, className }: SanitizedHTMLProps) {
  const sanitized = useMemo(() => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'small'],
      ALLOWED_ATTR: ['class', 'style'],
    });
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
