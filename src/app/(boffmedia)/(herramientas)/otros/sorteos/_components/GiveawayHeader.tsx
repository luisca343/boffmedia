import { motion } from "framer-motion";
import { Gift, Trophy, Sparkles } from "lucide-react";

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
          className="w-32 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 mx-auto rounded-full mb-6"
          variants={itemVariants}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <p className="text-lg text-surface-300 max-w-2xl mx-auto mb-6 leading-relaxed">
          Herramienta moderna y elegante para realizar sorteos justos entre los miembros de la comunidad.
        </p>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl py-3 px-6 max-w-sm mx-auto backdrop-blur-sm"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
        </motion.div>
        <span className="text-yellow-300 font-medium">
          ¡Buena suerte a todos los participantes!
        </span>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${25 + (i * 12)}%`,
              top: `${30 + (i % 2) * 25}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-3 h-3 text-yellow-400/20" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}