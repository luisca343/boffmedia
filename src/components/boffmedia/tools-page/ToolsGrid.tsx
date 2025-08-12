"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ToolsGridProps {
  tools: any[];
  variants: any;
  itemVariants: any;
  t: (key: string, params?: any) => string;
}

export function ToolsGrid({ tools, variants, itemVariants, t }: ToolsGridProps) {
  const router = useRouter();

  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
      variants={variants}
    >
      {tools.map((tool, index) => (
        <motion.div
          key={tool.title}
          variants={itemVariants}
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card 
            className="bg-surface-800/80 backdrop-blur-sm border-surface-700/50 hover:bg-surface-700/90 hover:border-surface-600/70 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden shadow-lg hover:shadow-2xl group"
            onClick={() => router.push(tool.href)}
          >
            <div className={`h-2 bg-gradient-to-r ${tool.color}`}></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-surface-700/50 border border-surface-600/30 group-hover:scale-110 transition-transform duration-300">
                  {tool.icon ? (
                    <Image 
                      src={tool.icon} 
                      alt={tool.title} 
                      width={40} 
                      height={40} 
                      className="object-cover"
                    />
                  ) : (
                    tool.iconFallback
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl text-surface-50 group-hover:text-primary-300 transition-colors">
                      {tool.title}
                    </CardTitle>
                    {tool.isNew && (
                      <Badge variant="secondary" className="bg-highlight-500/20 text-highlight-400 border-highlight-500/30 text-xs">
                        Nuevo
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-surface-300">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2">
                {tool.tools.map((toolName: string) => (
                  <Badge 
                    key={toolName} 
                    variant="outline"
                    className="bg-surface-700/30 text-surface-300 border-surface-600/30 text-xs"
                  >
                    {toolName}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-xs text-surface-400">
                <span className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Popularidad: {tool.popularity === 'high' ? 'Alta' : 'Media'}
                </span>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-surface-700/50 pt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 p-0 ml-auto group-hover:translate-x-1 transition-all duration-300"
              >
                {t("explore")} 
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}