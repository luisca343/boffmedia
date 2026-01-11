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
      className="mt-20 bg-gradient-to-br from-surface-800/50 to-surface-900/50 rounded-2xl p-6 lg:p-8 backdrop-blur-sm border border-surface-700/30 shadow-2xl"
      variants={variants}
    >
      <h3 className="text-2xl font-bold text-surface-100 mb-6 flex items-center">
        <Stars className="mr-3 h-6 w-6 text-primary-400" />
        {t("ui.externalLinks.title")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((link) => (
          <motion.a 
            key={link.href}
            href={link.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between border border-surface-600/20 hover:border-surface-500/30 group"
            whileHover={{ scale: 1.02 }}
          >
            <div>
              <span className="text-surface-100 font-medium text-lg">{link.title}</span>
              <p className="text-surface-400 text-sm mt-1">{link.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary-400 mt-3 group-hover:translate-x-1 transition-transform duration-300 self-end" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}