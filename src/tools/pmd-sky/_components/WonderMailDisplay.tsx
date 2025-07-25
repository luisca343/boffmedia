import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HiMail, HiCheckCircle, HiClipboardCopy, HiInformationCircle } from "react-icons/hi";

interface WonderMailDisplayProps {
  mail: string;
  isEuropean: boolean;
  onCopy: () => void;
  copied: boolean;
}

export function WonderMailDisplay({ 
  mail, 
  isEuropean, 
  onCopy, 
  copied 
}: WonderMailDisplayProps) {
  return (
    <Card className="p-6 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <HiMail className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Wonder Mail {isEuropean ? "(EU)" : "(US/JP)"}
          </h2>
          <HiMail className="w-6 h-6 text-blue-400" />
        </div>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          {isEuropean ? "European Version" : "US/Japanese Version"}
        </Badge>
      </div>
      
      <div className="relative bg-surface-900/50 p-6 rounded-xl border border-surface-600/30">
        <div className="text-center font-mono text-lg leading-relaxed text-surface-50 select-all">
          {mail.split("\n").map((line, index) => (
            <div key={index} className="py-1">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
        
        <motion.button
          onClick={onCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 border border-surface-600/30 transition-colors"
        >
          {copied ? (
            <HiCheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <HiClipboardCopy className="w-5 h-5 text-surface-300" />
          )}
        </motion.button>
      </div>
      
      <p className="text-center text-surface-400 text-sm mt-4 flex items-center justify-center gap-2">
        <HiInformationCircle className="w-4 h-4" />
        Click the copy button above to copy the Wonder Mail to your clipboard
      </p>
    </Card>
  );
}
