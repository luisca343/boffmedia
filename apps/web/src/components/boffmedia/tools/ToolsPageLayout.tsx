"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight, Zap } from "lucide-react";
import { FeaturedTool } from "./FeaturedTool";
import { ToolsGrid } from "./ToolsGrid";
import { ExternalResources } from "./ExternalResources";

interface ToolsPageLayoutProps {
  title: {
    prefix: string;
    highlight: string;
  };
  subtitle: string;
  logoSrc: string;
  logoAlt: string;
  tools: any[];
  externalLinks: any[];
  t: (key: string, params?: any) => string;
}

export function ToolsPageLayout({
  title,
  subtitle,
  logoSrc,
  logoAlt,
  tools,
  externalLinks,
  t,
}: ToolsPageLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const featuredTool = tools.find((tool) => tool.featured);
  const otherTools = tools.filter((tool) => !tool.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        className="mb-12 lg:mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          {/* Left: Title block */}
          <div className="text-center lg:text-left flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-5">
              <span className="text-xs font-mono text-surface-500 tracking-widest uppercase">
                Herramientas
              </span>
              <ChevronRight className="w-3 h-3 text-surface-600" />
              <span className="text-xs font-mono text-primary-400 tracking-widest uppercase">
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
                  background:
                    "linear-gradient(135deg, #fde68a 0%, #fb923c 40%, #f97316 70%, #ea580c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 25px rgba(249,115,22,0.3))",
                }}
              >
                {title.highlight.toUpperCase()}
              </span>
            </h1>

            {/* Accent divider */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-primary-500/60 to-transparent" />
              <Zap
                className="w-3 h-3 text-primary-400"
                style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.5))" }}
              />
            </div>

            <p className="text-surface-400 max-w-xl text-sm leading-relaxed tracking-wide">
              {subtitle}
            </p>
          </div>

          {/* Right: Logo */}
          {isMounted && (
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
                    background:
                      "radial-gradient(ellipse at center, rgba(249,115,22,0.2) 0%, transparent 70%)",
                    filter: "blur(16px)",
                  }}
                />
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={180}
                  height={80}
                  className="object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Featured Tool */}
      {featuredTool && <FeaturedTool tool={featuredTool} t={t} />}

      {/* Other Tools Grid */}
      {otherTools.length > 0 && <ToolsGrid tools={otherTools} t={t} />}

      {/* External Resources */}
      <ExternalResources links={externalLinks} t={t} />
    </div>
  );
}
