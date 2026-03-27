import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { LootboxBoxConfig } from "@boffmedia/shared";

interface BoxDisplayProps {
  lootBox: LootboxBoxConfig;
}

export function BoxDisplay({ lootBox }: BoxDisplayProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="relative w-64 h-64 cursor-pointer transform hover:scale-105 transition-transform duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image 
        src={lootBox.image} 
        alt={lootBox.name}
        fill
        className="object-contain"
      />

      {/* Animation for hovered state */}
      {hovered && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-dashed"
          />
          
          {/* Sparkle effects */}
          {[...Array(5)].map((_, i) => (
            <motion.div 
              key={i}
              initial={{ 
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                opacity: 0 
              }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5 + Math.random(),
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
              className="absolute w-3 h-3 bg-cyan-500 rounded-full blur-sm"
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%` 
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}