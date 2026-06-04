"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ToolSectionHeader } from "@/components/boffmedia-old/tools/ToolSectionHeader";

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
      className="relative backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 flex flex-col p-5 group border"
      style={{
        background: isHovered
          ? "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))"
          : "linear-gradient(145deg, rgba(30,41,59,0.75), rgba(15,23,42,0.85))",
        borderColor: isHovered ? "rgba(249,115,22,0.4)" : "rgba(71,85,105,0.55)",
        boxShadow: isHovered
          ? "0 0 30px rgba(249,115,22,0.15), 0 8px 24px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.02)",
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
      className="mt-16 relative backdrop-blur-sm rounded-lg overflow-hidden border border-surface-600/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        background: "linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="p-6 lg:p-8">
        <ToolSectionHeader label={t("externalLinks.title")} color="primary" />

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
