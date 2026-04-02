"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight, Zap } from "lucide-react";

type PageHeaderTheme = "primary" | "accent";

interface ThemeConfig {
  breadcrumbClass: string;
  dividerClass: string;
  zapClass: string;
  zapGlow: string;
  titleGradient: string;
  titleGlow: string;
  logoGlow: string;
}

const THEMES: Record<PageHeaderTheme, ThemeConfig> = {
  primary: {
    breadcrumbClass: "text-primary-400",
    dividerClass: "from-primary-500/60",
    zapClass: "text-primary-400",
    zapGlow: "rgba(249,115,22,0.5)",
    titleGradient: "linear-gradient(135deg, #fde68a 0%, #fb923c 40%, #f97316 70%, #ea580c 100%)",
    titleGlow: "rgba(249,115,22,0.3)",
    logoGlow: "rgba(249,115,22,0.2)",
  },
  accent: {
    breadcrumbClass: "text-primary-400",
    dividerClass: "from-accent-500/60",
    zapClass: "text-accent-400",
    zapGlow: "rgba(168,85,247,0.5)",
    titleGradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #7c3aed 100%)",
    titleGlow: "rgba(139,92,246,0.3)",
    logoGlow: "rgba(139,92,246,0.2)",
  },
};

export interface PageHeaderProps {
  title: { prefix: string; highlight: string };
  subtitle: string;
  logoSrc?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  theme?: PageHeaderTheme;
}

export function PageHeader({
  title,
  subtitle,
  logoSrc,
  logoAlt,
  logoWidth = 180,
  logoHeight = 80,
  theme = "primary",
}: PageHeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const cfg = THEMES[theme];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      className="mb-12 lg:mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
        <div className="text-center lg:text-left flex-1">
          <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-5">
            <span className="text-xs font-mono text-surface-500 tracking-widest uppercase">
              Herramientas
            </span>
            <ChevronRight className="w-3 h-3 text-surface-600" />
            <span className={`text-xs font-mono ${cfg.breadcrumbClass} tracking-widest uppercase`}>
              {title.highlight}
            </span>
          </div>

          <h1
            className="font-black tracking-tight leading-none mb-4"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            <span className="block text-lg sm:text-xl text-surface-400 font-medium tracking-[0.25em] mb-2">
              {title.prefix}
            </span>
            <span
              className="text-4xl sm:text-5xl lg:text-6xl"
              style={{
                background: cfg.titleGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: `drop-shadow(0 0 25px ${cfg.titleGlow})`,
              }}
            >
              {title.highlight.toUpperCase()}
            </span>
          </h1>

          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <div className={`h-px w-16 bg-gradient-to-r ${cfg.dividerClass} to-transparent`} />
            <Zap
              className={`w-3 h-3 ${cfg.zapClass}`}
              style={{ filter: `drop-shadow(0 0 6px ${cfg.zapGlow})` }}
            />
          </div>

          <p className="text-surface-400 max-w-xl text-sm leading-relaxed tracking-wide">
            {subtitle}
          </p>
        </div>

        {isMounted && logoSrc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <div className="relative p-4">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `radial-gradient(ellipse at center, ${cfg.logoGlow} 0%, transparent 70%)`,
                  filter: "blur(16px)",
                }}
              />
              <Image
                src={logoSrc}
                alt={logoAlt ?? ""}
                width={logoWidth}
                height={logoHeight}
                className="object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
