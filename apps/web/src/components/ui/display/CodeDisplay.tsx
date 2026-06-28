import { motion } from "framer-motion";
import { Card } from "@/components/ui/primitives/card";
import { Badge } from "@/components/ui/primitives/badge";
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
    <Card className={`p-6 rounded-2xl bg-gradient-to-br from-layer-2/90 to-layer-1/90 border-edge/50 backdrop-blur-sm shadow-2xl ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <div className="flex items-center justify-center gap-3 mb-3">
              {icon && <span className="text-secondary-hover">{icon}</span>}
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-hover to-cyan-400">
                {title}
              </h2>
              {icon && <span className="text-secondary-hover">{icon}</span>}
            </div>
          )}
          {badge && (
            <Badge 
              variant={badge.variant || "secondary"} 
              className={`bg-secondary/20 text-secondary-hover border-secondary/30 ${badge.className || ''}`}
            >
              {badge.text}
            </Badge>
          )}
          {subtitle && (
            <p className="text-ink-muted text-sm mt-2">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="relative bg-layer-1/50 p-6 rounded-xl border border-edge/30">
        <div className="text-center font-mono text-lg leading-relaxed text-ink select-all">
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
            className="absolute top-3 right-3 p-2 rounded-lg bg-layer-3/50 hover:bg-layer-3/50 border border-edge/30 transition-colors"
          >
            {copied ? (
              <HiCheckCircle className="w-5 h-5 text-warning-hover" />
            ) : (
              <HiClipboardCopy className="w-5 h-5 text-ink" />
            )}
          </motion.button>
        )}
      </div>
      
      {copyable && (
        <p className="text-center text-ink-muted text-sm mt-4 flex items-center justify-center gap-2">
          <HiInformationCircle className="w-4 h-4" />
          Click the copy button above to copy to your clipboard
        </p>
      )}
    </Card>
  );
}
