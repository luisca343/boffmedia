import React from 'react';

interface RainbowTextProps {
  text: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colors = ['text-pink-500', 'text-cyan-400', 'text-yellow-300', 'text-green-400', 'text-purple-400', 'text-red-400', 'text-blue-400', 'text-indigo-400'];

const RainbowText = React.memo(({ text, size = 'md', className = '' }: RainbowTextProps) => {
  const shuffledColors = colors.sort(() => Math.random() - 0.5);
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-5xl mb-4' : 'text-6xl mb-12';
  const combinedClassName = `font-bold text-center z-10 animate-pulse ${sizeClass} ${className}`;

  const words = text.split(' ');

  return (
    <h1 className={combinedClassName}>
      {words.map((word, index) => {
        const colorClass = shuffledColors[index % colors.length];
        const firstChar = word.charAt(0);
        const isUppercase = firstChar === firstChar.toUpperCase();
        return (
          <span key={index}>
            {isUppercase ? (
              <span className={`${colorClass} ${sizeClass}`}>{firstChar}</span>
            ) : (
              <span className={colorClass}>{firstChar}</span>
            )}
            <span className={colorClass}>{word.slice(1)} </span>
          </span>
        );
      })}
    </h1>
  );
});

RainbowText.displayName = 'RainbowText';

export { RainbowText };