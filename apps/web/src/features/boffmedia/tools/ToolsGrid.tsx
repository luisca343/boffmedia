"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight, Cpu, Gamepad2, Sparkles } from "lucide-react";
import { getBoffStyle } from "@/features/boffmedia/tools/utils/getBoffStyle";
import { ToolSectionHeader } from "@/features/boffmedia/tools/ToolSectionHeader";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";

interface ToolsGridProps {
  tools: any[];
  t?: (key: string, params?: any) => string;
}

function ToolCard({ tool, index, exploreLabel }: { tool: any; index: number; exploreLabel: string }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(isHovered, 1400);

  const boff = getBoffStyle(tool.color);
  const featureList: string[] = tool.tools ?? tool.features ?? [];
  const totalCount = featureList.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer"
      onClick={() => router.push(tool.href)}
    >
      <div
        className="relative h-full border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500 flex flex-col"
        style={{
          background: isHovered
            ? `linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))`
            : `linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.9))`,
          borderColor: isHovered ? boff.border : "rgba(71,85,105,0.6)",
          boxShadow: isHovered
            ? `0 0 45px ${boff.glow}, 0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 6px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
      >
        {/* Top boff bar — thicker and always visible */}
        <div
          className={`h-[3px] bg-gradient-to-r ${tool.color} flex-shrink-0 transition-all duration-300`}
          style={{
            opacity: isHovered ? 1 : 0.75,
            boxShadow: isHovered ? `0 0 12px ${boff.glow}` : "none",
          }}
        />

        {/* Ambient inner tint — always on, brightens on hover */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${boff.glow.replace("0.25", "0.12").replace("0.3", "0.12")} 0%, transparent 65%)`,
            opacity: isHovered ? 1 : 0.6,
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

        {/* Corner brackets — always visible, brighten on hover */}
        {(
          [
            "absolute top-3 left-3 w-4 h-4 border-t border-l",
            "absolute top-3 right-3 w-4 h-4 border-t border-r",
            "absolute bottom-3 left-3 w-4 h-4 border-b border-l",
            "absolute bottom-3 right-3 w-4 h-4 border-b border-r",
          ] as const
        ).map((cls, i) => (
          <div
            key={i}
            className={`${cls} transition-all duration-300 pointer-events-none`}
            style={{ borderColor: isHovered ? boff.scan : "rgba(100,116,139,0.55)" }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-950/60 border flex items-center justify-center transition-transform duration-300"
              style={{
                borderColor: isHovered ? boff.border : "rgba(51,65,85,0.5)",
                transform: isHovered ? "scale(1.08)" : "scale(1)",
              }}
            >
              {tool.icon ? (
                <Image src={tool.icon} alt={tool.title} width={40} height={40} className="object-contain" />
              ) : tool.iconFallback ? (
                tool.iconFallback
              ) : (
                <Gamepad2 className="w-7 h-7 text-surface-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3
                  className="text-lg font-black text-surface-50 leading-tight transition-colors duration-300 truncate"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)",
                  }}
                >
                  {tool.title}
                </h3>
                {tool.isNew && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-success-500/40 text-success-400 bg-success-500/10 tracking-widest flex-shrink-0"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    <Sparkles className="w-2 h-2" />
                    NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">{tool.description}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-4" />

          {/* Feature list */}
          <div className="space-y-1.5 flex-1 mb-5">
            {featureList.map((name: string) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: boff.scan }}
                />
                <span className="text-xs text-surface-400">{name}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-800/50">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-surface-600" />
              <span className="text-xs font-mono text-surface-600 tracking-widest">
                {String(totalCount).padStart(2, "0")} TOOLS
              </span>
            </div>
            <motion.span
              className="flex items-center gap-1 text-xs font-mono font-bold tracking-widest uppercase"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: boff.scan,
              }}
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {exploreLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>

        {/* Bottom line */}
        <div
          className={`h-px bg-gradient-to-r ${tool.color} flex-shrink-0 transition-opacity duration-500`}
          style={{ opacity: isHovered ? 0.3 : 0 }}
        />
      </div>
    </motion.div>
  );
}

export function ToolsGrid({ tools, t }: ToolsGridProps) {
  const exploreLabel = typeof t === "function" ? t("explore") : "ACCEDER";

  return (
    <div className="mb-12">
      <ToolSectionHeader label="Más herramientas" color="neutral" />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
        {tools.map((tool, index) => (
          <ToolCard key={tool.title} tool={tool} index={index} exploreLabel={exploreLabel} />
        ))}
      </div>
    </div>
  );
}
