'use client'
import { useState, useEffect } from 'react';

const ExternalWebsiteRenderer = ({url} : {url: string}) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const fetchWebsiteContent = async () => {
      try {
        const response = await fetch(url);
        const html = await response.text();
        setHtmlContent(html);
      } catch (error) {
        console.error('Error fetching website content:', error);
      }
    };

    fetchWebsiteContent();
  }, [url]);

  return (
    <div  className="w-full h-full"  dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default ExternalWebsiteRenderer;
