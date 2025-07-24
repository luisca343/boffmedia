"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Database, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  t
}: ToolsPageLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const featuredTool = tools.find(tool => tool.featured);

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header */}
      <motion.div className="mb-12 lg:mb-16" variants={itemVariants}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-center lg:text-left flex-1">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-50 mb-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {title.prefix}{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
                {title.highlight}
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl lg:text-2xl text-surface-300 max-w-2xl"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          </div>
          
          {isMounted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-500/20 rounded-2xl blur-xl"></div>
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={200}
                  height={90}
                  className="object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Featured Tool */}
      {featuredTool && (
        <FeaturedTool 
          tool={featuredTool} 
          variants={itemVariants}
          t={t}
        />
      )}

      {/* Tools Grid */}
      <ToolsGrid 
        tools={tools}
        variants={containerVariants}
        itemVariants={itemVariants}
        t={t}
      />
      
      {/* External Resources */}
      <ExternalResources 
        links={externalLinks}
        variants={itemVariants}
        t={t}
      />
    </motion.div>
  );
}