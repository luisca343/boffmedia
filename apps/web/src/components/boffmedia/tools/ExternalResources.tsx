"use client";

import { motion } from "framer-motion";
import { ArrowRight, Stars } from "lucide-react";

interface ExternalResourcesProps {
  links: Array<{
    href: string;
    title: string;
    description: string;
  }>;
  variants: any;
  t: (key: string, params?: any) => string;
}

export function ExternalResources({ links, variants, t }: ExternalResourcesProps) {
  return (
    <motion.div
      className="mt-20 relative bg-surface-900/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-surface-700/50 shadow-2xl"
      variants={variants}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
      <div className="p-6 lg:p-8">
        <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-surface-300 mb-6 flex items-center gap-3">
          <Stars className="h-4 w-4 text-primary-400" />
          {t("externalLinks.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {links.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-800/60 hover:bg-surface-700/50 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between border border-surface-700/40 hover:border-primary-500/25 group"
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <span className="text-surface-100 font-medium text-base">{link.title}</span>
                <p className="text-surface-400 text-sm mt-1">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary-500/60 group-hover:text-primary-400 mt-3 group-hover:translate-x-1 transition-all duration-200 self-end" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}