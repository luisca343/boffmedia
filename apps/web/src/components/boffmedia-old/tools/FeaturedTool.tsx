"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { getBoffStyle } from "@/components/boffmedia-old/tools/utils/getBoffStyle";
import { BoffButton } from "@/components/boffmedia-old/tools/BoffButton";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";

interface FeaturedToolProps {
  tool: any;
  t: (key: string, params?: any) => string;
}

export function FeaturedTool({ tool, t }: FeaturedToolProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(isHovered, 1600);

  const boff = getBoffStyle(tool.color);

  return (
    <motion.div
      className="mb-12 cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      onClick={() => router.push(tool.href)}
    >
      {/* Section label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-primary/40" />
        <span
          className="text-xs font-mono text-primary-hover/70 tracking-[0.4em] uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          // {t("featuredTool")}
        </span>
        <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-primary/40" />
      </div>

      <div
        className="relative border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500"
        style={{
          background: isHovered
            ? "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))"
            : "linear-gradient(145deg, rgba(30,41,59,0.88), rgba(15,23,42,0.92))",
          borderColor: isHovered ? boff.border : "rgba(71,85,105,0.65)",
          boxShadow: isHovered
            ? `0 0 60px ${boff.glow}, 0 24px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
      >
        {/* Top neon bar — thicker and always visible */}
        <div
          className={`h-[3px] bg-gradient-to-r ${tool.color} transition-all duration-300`}
          style={{
            opacity: isHovered ? 1 : 0.8,
            boxShadow: isHovered ? `0 0 16px ${boff.glow}` : "none",
          }}
        />

        {/* Ambient inner tint */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${boff.glow.replace("0.3", "0.1")} 0%, transparent 55%)`,
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        {/* Scan line */}
        {isHovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${boff.scan}, transparent)`,
            }}
          />
        )}

        {/* Corner brackets */}
        {(
          [
            "absolute top-3 left-3 w-5 h-5 border-t border-l",
            "absolute top-3 right-3 w-5 h-5 border-t border-r",
            "absolute bottom-3 left-3 w-5 h-5 border-b border-l",
            "absolute bottom-3 right-3 w-5 h-5 border-b border-r",
          ] as const
        ).map((cls, i) => (
          <div
            key={i}
            className={`${cls} transition-all duration-300 pointer-events-none`}
            style={{ borderColor: isHovered ? boff.scan : "rgba(100,116,139,0.55)" }}
          />
        ))}

        <div className="lg:flex">
          {/* Left: Content */}
          <div className="lg:w-2/3 p-7 lg:p-10 relative z-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-base/60 border flex items-center justify-center transition-transform duration-300"
                style={{
                  borderColor: isHovered ? boff.border : "rgba(51,65,85,0.5)",
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              >
                {tool.icon ? (
                  <Image src={tool.icon} alt={tool.title} width={48} height={48} className="object-contain" />
                ) : (
                  tool.iconFallback
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2
                    className="text-2xl lg:text-3xl font-black leading-tight transition-colors duration-300"
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)",
                    }}
                  >
                    {tool.title}
                  </h2>
                  {tool.isNew && (
                    <span
                      className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border border-success-border/40 text-success-hover bg-success/10 tracking-widest flex-shrink-0"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-primary-hover/60 tracking-widest uppercase">
                  // Herramienta destacada
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-layer-3/50 to-transparent mb-6" />

            <p className="text-ink text-sm leading-relaxed mb-7">{tool.description}</p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {(tool.tools ?? tool.features ?? []).map((name: string) => (
                <span
                  key={name}
                  className="text-xs font-mono px-3 py-1 rounded border border-edge/50 bg-base/50 text-ink tracking-wide"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* CTA */}
            <BoffButton isHovered={isHovered} boff={boff}>
              {t("accessButton", { tool: tool.title })}
            </BoffButton>
          </div>

          {/* Right: Hero image */}
          {tool.heroImage && (
            <div className="lg:w-1/3 relative overflow-hidden min-h-[280px]">
              <Image
                src={tool.heroImage}
                alt={tool.title}
                fill
                className="object-cover transition-transform duration-700"
                style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
                priority
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute inset-0 bg-gradient-to-r from-layer-1/80 via-layer-1/30 to-transparent hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />
              {/* Updated badge */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-base/80 border border-edge/50 rounded px-2.5 py-1 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-success-hover animate-pulse" />
                <span className="text-xs font-mono text-ink tracking-widest">
                  Recién actualizado
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom line */}
        <div
          className={`h-px bg-gradient-to-r ${tool.color} transition-opacity duration-500`}
          style={{ opacity: isHovered ? 0.3 : 0 }}
        />
      </div>
    </motion.div>
  );
}
