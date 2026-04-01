"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

interface ExternalResourcesProps {
  links: Array<{
    href: string;
    title: string;
    description: string;
  }>;
  t: (key: string, params?: any) => string;
}

function ResourceCard({ link, index }: { link: ExternalResourcesProps["links"][number]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-surface-900/50 border backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 flex flex-col p-5 group"
      style={{
        borderColor: isHovered ? "rgba(249,115,22,0.35)" : "rgba(51,65,85,0.5)",
        boxShadow: isHovered ? "0 0 25px rgba(249,115,22,0.15)" : "none",
      }}
    >
      {/* Corner brackets */}
      <div
        className="absolute top-2 left-2 w-3 h-3 border-t border-l transition-all duration-300 pointer-events-none"
        style={{ borderColor: isHovered ? "rgba(251,146,60,0.6)" : "rgba(100,116,139,0.25)" }}
      />
      <div
        className="absolute bottom-2 right-2 w-3 h-3 border-b border-r transition-all duration-300 pointer-events-none"
        style={{ borderColor: isHovered ? "rgba(251,146,60,0.6)" : "rgba(100,116,139,0.25)" }}
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-sm font-bold text-surface-100 leading-tight transition-colors duration-300"
          style={{ color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)" }}
        >
          {link.title}
        </span>
        <ExternalLink
          className="w-3.5 h-3.5 text-surface-600 flex-shrink-0 mt-0.5 transition-colors duration-300"
          style={{ color: isHovered ? "rgb(251,146,60)" : undefined }}
        />
      </div>

      <p className="text-xs text-surface-500 leading-relaxed flex-1">{link.description}</p>

      <motion.div
        className="flex items-center gap-1 mt-3 self-end"
        animate={{ x: isHovered ? 4 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight
          className="h-3.5 w-3.5 transition-colors duration-300"
          style={{ color: isHovered ? "rgb(251,146,60)" : "rgb(100,116,139)" }}
        />
      </motion.div>
    </motion.a>
  );
}

export function ExternalResources({ links, t }: ExternalResourcesProps) {
  return (
    <motion.div
      className="mt-16 relative bg-surface-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-surface-700/40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="p-6 lg:p-8">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-xs font-mono text-primary-400/70 tracking-[0.35em] uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            // {t("externalLinks.title")}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-surface-700/50 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {links.map((link, i) => (
            <ResourceCard key={link.href} link={link} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent" />
    </motion.div>
  );
}
