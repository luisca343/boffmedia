import React from 'react';

interface RainbowTextProps {
  text: string;
}

function RainbowText({ text }: RainbowTextProps) {
  const colors = ['text-pink-500', 'text-cyan-400', 'text-yellow-300', 'text-green-400', 'text-purple-400'];
  
  const words = text.split(' ');

  return (
    <h1 className="text-4xl font-bold mb-12 text-center z-10 animate-pulse">
      {words.map((word, index) => {
        const colorClass = colors[index % colors.length];
        const firstChar = word.charAt(0);
        const isUppercase = firstChar === firstChar.toUpperCase();
        return (
          <span key={index}>
            {isUppercase ? (
              <span className={`${colorClass} text-6xl`}>{firstChar}</span>
            ) : (
              <span className={colorClass}>{firstChar}</span>
            )}
            <span className={colorClass}>{word.slice(1)} </span>
          </span>
        );
      })}
    </h1>
  );
}

export default RainbowText;