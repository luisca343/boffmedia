import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HiCheckCircle, HiClipboardCopy, HiInformationCircle } from "react-icons/hi";

interface CodeDisplayProps {
  code: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onCopy?: () => void;
  copied?: boolean;
  copyable?: boolean;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline";
    className?: string;
  };
  className?: string;
}

export function CodeDisplay({ 
  code, 
  title,
  subtitle,
  icon,
  onCopy, 
  copied = false,
  copyable = true,
  badge,
  className 
}: CodeDisplayProps) {
  return (
    <Card className={`p-6 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <div className="flex items-center justify-center gap-3 mb-3">
              {icon && <span className="text-secondary-400">{icon}</span>}
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-cyan-400">
                {title}
              </h2>
              {icon && <span className="text-secondary-400">{icon}</span>}
            </div>
          )}
          {badge && (
            <Badge 
              variant={badge.variant || "secondary"} 
              className={`bg-secondary-500/20 text-secondary-300 border-secondary-500/30 ${badge.className || ''}`}
            >
              {badge.text}
            </Badge>
          )}
          {subtitle && (
            <p className="text-surface-400 text-sm mt-2">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="relative bg-surface-900/50 p-6 rounded-xl border border-surface-600/30">
        <div className="text-center font-mono text-lg leading-relaxed text-surface-50 select-all">
          {code.split("\n").map((line, index) => (
            <div key={index} className="py-1">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
        
        {copyable && onCopy && (
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-3 right-3 p-2 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 border border-surface-600/30 transition-colors"
          >
            {copied ? (
              <HiCheckCircle className="w-5 h-5 text-highlight-400" />
            ) : (
              <HiClipboardCopy className="w-5 h-5 text-surface-300" />
            )}
          </motion.button>
        )}
      </div>
      
      {copyable && (
        <p className="text-center text-surface-400 text-sm mt-4 flex items-center justify-center gap-2">
          <HiInformationCircle className="w-4 h-4" />
          Click the copy button above to copy to your clipboard
        </p>
      )}
    </Card>
  );
}
