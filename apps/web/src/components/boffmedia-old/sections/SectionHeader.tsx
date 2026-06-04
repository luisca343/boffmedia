"use client"
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: "default" | "orange" | string;
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
  variant = "default",
  gradientFrom,
  gradientTo,
  className = "",
  leftIcon,
  rightIcon,
  leftIconBg,
  rightIconBg,
  leftIconAnimDelay = "0s",
  rightIconAnimDelay = "0.5s",
}: SectionHeaderProps) {
  // Color variants
  let colorConfig: any = {
    gradientFrom: "from-accent-400",
    gradientTo: "to-secondary-400",
    line: "from-accent-500 to-secondary-400",
    leftIconBg: "from-accent-500 to-secondary-600",
    rightIconBg: "from-secondary-500 to-accent-600",
    titleClass: "text-4xl sm:text-5xl md:text-6xl",
    subtitleClass: "text-lg text-surface-300",
  };
  if (variant === "orange") {
    colorConfig = {
      gradientFrom: "from-orange-400 via-yellow-400 to-orange-500",
      gradientTo: "",
      line: "from-orange-400 to-yellow-400",
      leftIconBg: "from-orange-400 to-yellow-400",
      rightIconBg: "from-yellow-400 to-orange-400",
      titleClass: "text-3xl sm:text-4xl lg:text-5xl",
      subtitleClass: "text-orange-200",
    };
  }
  // Allow custom overrides
  if (gradientFrom) colorConfig.gradientFrom = gradientFrom;
  if (gradientTo) colorConfig.gradientTo = gradientTo;
  if (leftIconBg) colorConfig.leftIconBg = leftIconBg;
  if (rightIconBg) colorConfig.rightIconBg = rightIconBg;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className={`text-center pt-4 mb-12 relative ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          {leftIcon && (
            <motion.div
              animate={{
                rotate: [0, 8, -8, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: parseFloat(leftIconAnimDelay) || 0
              }}
              className={`w-8 h-8 ${colorConfig.leftIconBg ? `bg-gradient-to-br ${colorConfig.leftIconBg}` : ''} rounded-full flex items-center justify-center`}
              style={{ animationDelay: leftIconAnimDelay }}
            >
              {leftIcon}
            </motion.div>
          )}
          <h1
            className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${colorConfig.gradientFrom} ${colorConfig.gradientTo} ${colorConfig.titleClass}`}
          >
            {title}
          </h1>
          {rightIcon && (
            <motion.div
              animate={{
                rotate: [0, -8, 8, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: parseFloat(rightIconAnimDelay) || 0.5
              }}
              className={`w-8 h-8 ${colorConfig.rightIconBg ? `bg-gradient-to-br ${colorConfig.rightIconBg}` : ''} rounded-full flex items-center justify-center`}
              style={{ animationDelay: rightIconAnimDelay }}
            >
              {rightIcon}
            </motion.div>
          )}
        </div>
        {/* Decorative Line */}
        <motion.div
          className={`w-32 h-0.5 bg-gradient-to-r ${colorConfig.line} mx-auto rounded-full mb-6`}
          variants={itemVariants}
        />
      </motion.div>
      {subtitle && (
        <p className={`max-w-3xl mx-auto leading-relaxed mb-4 ${colorConfig.subtitleClass}`}>{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}
