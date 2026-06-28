import { LootboxBoxConfig } from "@boffmedia/shared";
import { motion } from "framer-motion";
import Image from "next/image";

interface BoxAnimationProps {
  lootBox: LootboxBoxConfig;
}

export function BoxAnimation({ lootBox }: BoxAnimationProps) {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: [0.9, 1.1, 0.95, 1.05, 1],
          opacity: 1,
          rotate: [0, -2, 2, -2, 0]
        }}
        transition={{ 
          duration: 1.2,
          ease: "easeOut"
        }}
        className="relative w-80 h-80 z-10"
      >
        <Image 
          src={lootBox.image || "/smartrotom/img/apps/arcade/lootbox/trainer-box.png"}
          alt={lootBox.name}
          fill
          className="object-contain"
          priority={true}
        />
        
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 blur-md"
          style={{ mixBlendMode: 'overlay' }}
        />
      </motion.div>
      
      {/* Arcade-style text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -bottom-16 inset-x-0 text-center"
      >
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary-hover animate-text-shine">
          Abriendo {lootBox.name}...
        </h3>
      </motion.div>
    </div>
  );
}