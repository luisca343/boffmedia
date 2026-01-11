"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import { Card } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";

interface FeaturedToolProps {
  tool: any;
  variants: any;
  t: (key: string, params?: any) => string;
}

export function FeaturedTool({ tool, variants, t }: FeaturedToolProps) {
  const router = useRouter();

  // Extract color values for dynamic overlay
  const getOverlayColor = (colorClass: string) => {
    if (colorClass.includes('yellow')) return 'yellow';
    if (colorClass.includes('green')) return 'green';
    if (colorClass.includes('blue')) return 'blue';
    if (colorClass.includes('red')) return 'red';
    if (colorClass.includes('purple')) return 'purple';
    if (colorClass.includes('orange')) return 'orange';
    return 'blue'; // fallback
  };

  const overlayColor = getOverlayColor(tool.color);

  return (
    <motion.div 
      variants={variants}
      className="mb-16"
    >
      <Card className="bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 overflow-hidden backdrop-blur-sm shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500">
        <div className={`h-3 bg-gradient-to-r ${tool.color}`}></div>
        <div className="lg:flex">
          <div className="lg:w-2/3 p-6 lg:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-surface-700/50 to-surface-800/50 border border-surface-600/30 shadow-lg">
                {tool.icon ? (
                  <Image 
                    src={tool.icon} 
                    alt={tool.title} 
                    width={56} 
                    height={56} 
                    className="object-cover"
                  />
                ) : (
                  tool.iconFallback
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl lg:text-3xl font-bold text-surface-50">
                    {tool.title}
                  </h2>
                  {tool.isNew && (
                    <Badge className="bg-gradient-to-r from-highlight-500 to-highlight-600 text-white shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t("ui.newBadge")}
                    </Badge>
                  )}
                </div>
                <p className="text-primary-300 text-sm font-medium">{t("ui.featuredTool")}</p>
              </div>
            </div>
            
            <p className="text-surface-200 text-lg mb-8 leading-relaxed">
              {tool.description}
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {tool.tools.map((toolName: string) => (
                <Badge 
                  key={toolName} 
                  variant="secondary"
                  className="bg-surface-700/50 text-primary-300 border-primary-500/20 text-sm py-2 px-4"
                >
                  {toolName}
                </Badge>
              ))}
            </div>
            
            <Button 
              onClick={() => router.push(tool.href)}
              size="lg"
            >
              {t("ui.accessButton", { tool: tool.title })} 
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Enhanced image section with proper overlay */}
          <div className="lg:w-1/3 relative overflow-hidden min-h-[300px] group">
            {tool.heroImage && (
              <>
                <Image
                  src={tool.heroImage}
                  alt={tool.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                
                {/* Multi-layer overlay system */}
                <div className="absolute inset-0">
                  {/* Base darkening overlay for contrast */}
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Dynamic color overlay based on tool theme */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    overlayColor === 'yellow' ? 'from-yellow-500/10 via-transparent to-orange-500/5' :
                    overlayColor === 'green' ? 'from-highlight-500/10 via-transparent to-emerald-500/5' :
                    overlayColor === 'blue' ? 'from-secondary-500/10 via-transparent to-cyan-500/5' :
                    overlayColor === 'red' ? 'from-red-500/10 via-transparent to-rose-500/5' :
                    overlayColor === 'purple' ? 'from-accent-500/10 via-transparent to-violet-500/5' :
                    overlayColor === 'orange' ? 'from-orange-500/10 via-transparent to-red-500/5' :
                    'from-secondary-500/10 via-transparent to-cyan-500/5'
                  }`}></div>
                  
                  {/* Bottom gradient for badge readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  
                  {/* Corner accent gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-tl ${
                    overlayColor === 'yellow' ? 'from-yellow-400/15' :
                    overlayColor === 'green' ? 'from-highlight-400/15' :
                    overlayColor === 'blue' ? 'from-secondary-400/15' :
                    overlayColor === 'red' ? 'from-red-400/15' :
                    overlayColor === 'purple' ? 'from-accent-400/15' :
                    overlayColor === 'orange' ? 'from-orange-400/15' :
                    'from-secondary-400/15'
                  } via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                </div>
              </>
            )}
            
            {/* Enhanced badge with better positioning */}
            <div className="absolute bottom-4 left-4 z-10">
              <Badge className="bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-lg">
                <Clock className="w-3 h-3 mr-1" />
                  {t("ui.recentlyUpdated")}
              </Badge>
            </div>
            
            {/* Optional: Add a subtle pattern overlay for texture */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:24px_24px] pointer-events-none"></div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}