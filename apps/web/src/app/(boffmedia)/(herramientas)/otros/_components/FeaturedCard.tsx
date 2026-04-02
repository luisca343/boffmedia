"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import Image from "next/image";
import { getNeonStyle } from "@components/boffmedia/tools/utils/getNeonStyle";
import { NeonButton } from "@components/boffmedia/tools/NeonButton";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";

export interface FeaturedCardData {
  title: string;
  description: string;
  icon: string;
  iconFallback?: React.ReactNode;
  href: string;
  color: string;
  features: string[];
}

interface FeaturedCardProps {
  tool: FeaturedCardData;
}

export function FeaturedCard({ tool }: FeaturedCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(isHovered, 1600);
  const neon = getNeonStyle(tool.color);

  return (
    <motion.div
      className="mb-10 cursor-pointer"
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
        <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-primary-500/40" />
        <span
          className="text-xs font-mono text-primary-400/70 tracking-[0.4em] uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          // Herramienta destacada
        </span>
        <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-primary-500/40" />
      </div>

      <div
        className="relative bg-surface-900/70 border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500"
        style={{
          borderColor: isHovered ? neon.border : "rgba(51,65,85,0.6)",
          boxShadow: isHovered
            ? `0 0 50px ${neon.glow}, 0 20px 60px rgba(0,0,0,0.4)`
            : "0 4px 30px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className={`h-0.5 bg-gradient-to-r ${tool.color} transition-opacity duration-300`}
          style={{ opacity: isHovered ? 1 : 0.7 }}
        />

        {/* Scan line */}
        {isHovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${neon.scan}, transparent)`,
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
            style={{ borderColor: isHovered ? neon.scan : "rgba(100,116,139,0.35)" }}
          />
        ))}

        <div className="lg:flex">
          <div className="lg:w-2/3 p-7 lg:p-10 relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-950/60 border flex items-center justify-center transition-transform duration-300"
                style={{
                  borderColor: isHovered ? neon.border : "rgba(51,65,85,0.5)",
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              >
                {tool.icon ? (
                  <Image
                    src={tool.icon}
                    alt={tool.title}
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  tool.iconFallback
                )}
              </div>
              <div>
                <h2
                  className="text-2xl lg:text-3xl font-black leading-tight transition-colors duration-300"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)",
                  }}
                >
                  {tool.title}
                </h2>
                <p className="text-xs font-mono text-primary-400/60 tracking-widest uppercase mt-1">
                  // Herramienta destacada
                </p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-6" />

            <p className="text-surface-300 text-sm leading-relaxed mb-7">{tool.description}</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {tool.features.map((f) => (
                <span
                  key={f}
                  className="text-xs font-mono px-3 py-1 rounded border border-surface-700/50 bg-surface-950/50 text-surface-300 tracking-wide"
                >
                  {f}
                </span>
              ))}
            </div>

            <NeonButton isHovered={isHovered} neon={neon}>
              Acceder
            </NeonButton>
          </div>

          {/* Decorative right panel */}
          <div className="lg:w-1/3 relative overflow-hidden min-h-[220px] flex items-center justify-center bg-surface-950/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="h-32 w-32" style={{ color: neon.scan, opacity: 0.08 }} />
            </div>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${neon.glow}, transparent)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-900/80 via-surface-900/30 to-transparent hidden lg:block" />
          </div>
        </div>

        <div
          className={`h-px bg-gradient-to-r ${tool.color} transition-opacity duration-500`}
          style={{ opacity: isHovered ? 0.3 : 0 }}
        />
      </div>
    </motion.div>
  );
}
