import React from "react";


import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftIconBg?: string;
  rightIconBg?: string;
  leftIconAnimDelay?: string;
  rightIconAnimDelay?: string;
}

export function SectionHeader({
  title,
  subtitle,
  children,
  gradientFrom = "from-accent-400",
  gradientTo = "to-secondary-400",
  className = "",
  leftIcon,
  rightIcon,
  leftIconBg = "from-accent-500 to-secondary-600",
  rightIconBg = "from-secondary-500 to-accent-600",
  leftIconAnimDelay = "0s",
  rightIconAnimDelay = "0.5s",
}: SectionHeaderProps) {
  return (
    <div className={`text-center pt-4 mb-12 ${className}`}>
      <div className="relative inline-block">
        <h1
          className={`text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo} mb-4`}
        >
          {title}
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-accent-500 to-secondary-400 mx-auto rounded-full mb-6"></div>

        {/* Floating icons around title */}
        {leftIcon && (
          <div
            className={`absolute -top-6 -left-12 w-8 h-8 bg-gradient-to-br ${leftIconBg} rounded-full flex items-center justify-center animate-bounce`}
            style={{ animationDelay: leftIconAnimDelay }}
          >
            {leftIcon}
          </div>
        )}
        {rightIcon && (
          <div
            className={`absolute -top-6 -right-12 w-8 h-8 bg-gradient-to-br ${rightIconBg} rounded-full flex items-center justify-center animate-bounce`}
            style={{ animationDelay: rightIconAnimDelay }}
          >
            {rightIcon}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-lg text-surface-300 max-w-3xl mx-auto leading-relaxed mb-4">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
