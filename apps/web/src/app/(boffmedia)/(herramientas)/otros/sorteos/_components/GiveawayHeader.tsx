import { motion } from "framer-motion";
import { Gift } from "lucide-react";

export function GiveawayHeader() {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="text-center py-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        variants={itemVariants}
        className="relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={{ 
              rotate: [0, 8, -8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Gift className="w-8 h-8 text-orange-400" />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500">
            Sorteo BoffMedia
          </h1>
          
          <motion.div
            animate={{ 
              rotate: [0, -8, 8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          >
            <Gift className="w-8 h-8 text-yellow-400" />
          </motion.div>
        </div>

        {/* Decorative Line */}
        <motion.div 
          className="w-32 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 mx-auto rounded-full"
          variants={itemVariants}
        />
      </motion.div>
    </motion.div>
  );
}