import Image from "next/image";
import React, { ReactNode } from "react";


interface GameSpotlightCardProps {
  iconSrc?: string;
  iconAlt?: string;
  title?: string;
  titleGradientClass?: string;
  iconBgClass?: string; // e.g. 'from-emerald-600 to-highlight-700' or 'from-orange-500 to-amber-500'
  underlineClass?: string; // e.g. 'from-emerald-500 to-highlight-400' or 'from-orange-400 to-amber-400'
  headerClass?: string; // extra classes for header row (flex-row-reverse, text-right, etc)
  centeredImageHeader?: ReactNode; // for special centered image header (like Wingull)
  children: ReactNode;
}

export function GameSpotlightCard({
  iconSrc,
  iconAlt,
  title,
  titleGradientClass,
  iconBgClass = 'from-emerald-600 to-highlight-700',
  underlineClass = 'from-emerald-500 to-highlight-400',
  headerClass = '',
  centeredImageHeader,
  children,
}: GameSpotlightCardProps) {
  // If headerClass includes flex-row-reverse, align underline and features to right
  const isRightAligned = headerClass.includes('flex-row-reverse');

  // Special case: centered image header (for Wingull)
  if (centeredImageHeader) {
    return (
      <div className="w-full max-w-2xl space-y-8 mx-auto px-2 sm:px-4 md:px-8">
        {/* Centered image header (e.g. logo) */}
        <div className="flex justify-center mb-6">
          {centeredImageHeader}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-8 mx-auto px-2 sm:px-4 md:px-8">
      <div className={`flex items-center gap-4 mb-6 ${headerClass}`}>
        <div className="relative">
          <div className={`absolute inset-0 ${iconBgClass.includes('orange') ? 'bg-orange-500/30' : 'bg-emerald-500/30'} rounded-2xl blur-xl`}></div>
          <div className={`relative bg-gradient-to-br ${iconBgClass} p-4 rounded-xl`}>
            {iconSrc && (
              <Image
                src={iconSrc}
                alt={iconAlt || ''}
                width={60}
                height={60}
                className="rounded-lg"
              />
            )}
          </div>
        </div>
        <div className={isRightAligned ? 'text-right' : ''}>
          <h3 className={`text-4xl font-black text-transparent bg-clip-text ${titleGradientClass}`}>
            {title}
          </h3>
          <div className={`h-1 w-20 bg-gradient-to-r ${underlineClass} rounded-full mt-2 ${isRightAligned ? 'ml-auto' : ''}`}></div>
        </div>
      </div>
      {/* If right aligned, wrap children in a right-aligned div for features list and subtitle */}
      {isRightAligned ? (
        <div className="text-right">
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;

            const el = child as React.ReactElement<any, any>;
            const type = el.type;

            // Align simple text blocks (native elements like <p>, <h4>) to the right
            if (typeof type === 'string' && (type === 'p' || type === 'h4')) {
              const existingClassName = el.props.className || '';
              const cleanedClassName = existingClassName.replace(/text-(left|right|center|justify)/g, '').trim();
              return React.cloneElement(el, { className: `${cleanedClassName} text-right`.trim() } as any);
            }

            // If this child is a grid (features list), clone its rows and reverse flex rows
            const childClass = el.props?.className || '';
            if (childClass.includes('grid')) {
              const newChildren = React.Children.map(el.props.children, (row) => {
                if (!React.isValidElement(row)) return row;
                const rowEl = row as React.ReactElement<any, any>;
                const rowClass = rowEl.props?.className || '';
                if (rowClass.includes('flex')) {
                  return React.cloneElement(rowEl, { className: `${rowClass} flex-row-reverse`.trim() } as any);
                }
                return row;
              });
              return React.cloneElement(el, { children: newChildren } as any);
            }

            return el;
          })}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
