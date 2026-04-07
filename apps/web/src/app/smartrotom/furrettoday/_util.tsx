import React from "react";
import { NewsItem } from "./page";

export function getPreview(news: NewsItem, length: number) {
  if (!news || !news.content.trim()) return "Previsualización no disponible";
  // Get the first 5 HTML tags and convert them to plain text elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(news.content, "text/html");
  const elements = [];
  let count = 0;
  let charCount = 0;

  const children = Array.from(doc.body.children).slice(1); // Skip the first element

  for (const child of children) {
    if (count >= 5 || charCount >= length) break;

    let innerText =
      (child as HTMLElement).innerText || child.textContent || "";
    innerText = innerText.trim(); // Trim each line

    if (charCount + innerText.length > length) {
      // Truncate the innerText to fit within the character limit
      const remainingChars = length - charCount;
      const truncatedText = innerText.slice(0, remainingChars) + "...";

      elements.push(<div key={count}>{truncatedText}</div>);
      charCount += truncatedText.length; // Update charCount with truncated text length
      break;
    } else {
      elements.push(<div key={count}>{innerText}</div>);
      charCount += innerText.length; // Update charCount with innerText length
    }

    count++;
  }

  if (charCount === 0) return "Previsualización no disponible";
  return <div>{elements}</div>;
}