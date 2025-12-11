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
          <h3 className={`text-4xl font-bold text-transparent bg-clip-text ${titleGradientClass}`}>
            {title}
          </h3>
          <div className={`h-1 w-20 bg-gradient-to-r ${underlineClass} rounded-full mt-2 ${isRightAligned ? 'ml-auto' : ''}`}></div>
        </div>
      </div>
      {/* If right aligned, wrap children in a right-aligned div for features list and subtitle */}
      {isRightAligned ? (
        <div className="text-right">
          {/* If children is an array, check for a subtitle (p, h4, etc) and align it right */}
          {Array.isArray(children)
            ? children.map((child, idx) => {
                if (
                  child &&
                  typeof child === 'object' &&
                  (child.type === 'p' || child.type === 'h4')
                ) {
                  // Subtitle/description element
                  // Remove existing text alignment classes before adding text-right
                  const existingClassName = child.props.className || '';
                  const cleanedClassName = existingClassName.replace(/text-(left|right|center|justify)/g, '').trim();
                  return {
                    ...child,
                    props: {
                      ...child.props,
                      className: cleanedClassName + ' text-right',
                    },
                  };
                }
                if (
                  child &&
                  typeof child === 'object' &&
                  child.type === 'div' &&
                  child.props.className?.includes('grid')
                ) {
                  // This is the features grid, so map its children
                  return {
                    ...child,
                    props: {
                      ...child.props,
                      children: React.Children.map(child.props.children, (row) =>
                        row && typeof row === 'object' && row.props?.className?.includes('flex')
                          ? {
                              ...row,
                              props: {
                                ...row.props,
                                className: row.props.className + ' flex-row-reverse',
                              },
                            }
                          : row
                      ),
                    },
                  };
                }
                return child;
              })
            : children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
