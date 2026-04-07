"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

interface WinnerDisplayProps {
  winner: string;
  onReset: () => void;
}

export function WinnerDisplay({ winner, onReset }: WinnerDisplayProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    []
  );

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const trophyVariants = {
    idle: {
      y: [0, -15, 0],
      rotate: [0, -3, 3, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const celebrationItems = [
    { icon: Trophy, color: "text-yellow-400", position: "top-8 left-8", delay: 0 },
    { icon: Sparkles, color: "text-secondary-400", position: "top-8 right-8", delay: 0.5 },
    { icon: Trophy, color: "text-highlight-400", position: "bottom-8 left-8", delay: 1 },
    { icon: Sparkles, color: "text-accent-400", position: "bottom-8 right-8", delay: 1.5 }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col items-center justify-center text-center py-12 px-6 min-h-[500px] overflow-hidden"
    >
      {/* Celebration Icons */}
      {celebrationItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <motion.div
            key={index}
            className={`absolute ${item.position} ${item.color}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              rotate: 360
            }}
            transition={{ 
              duration: 3,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IconComponent className="w-8 h-8" />
          </motion.div>
        );
      })}

      {/* Main Trophy */}
      <motion.div
        variants={itemVariants}
        className="relative mb-8"
      >
        <motion.div
          variants={trophyVariants}
          animate="idle"
          className="relative z-10"
        >
          <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-lg" />
        </motion.div>
        
        {/* Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl"
        />
      </motion.div>

      {/* Winner Announcement */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
          ¡Tenemos un ganador!
        </h2>
      </motion.div>

      {/* Winner Card */}
      <motion.div
        variants={itemVariants}
        className="relative group mb-8 max-w-2xl w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-gradient-to-br from-surface-800/90 to-surface-900/90 border border-yellow-400/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-transparent rounded-2xl" />
          
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-400 mr-3" />
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-200 break-words text-center">
              {winner}
            </h3>
            <Sparkles className="w-6 h-6 text-yellow-400 ml-3" />
          </div>
        </div>
      </motion.div>

      {/* Congratulations Message */}
      <motion.div variants={itemVariants} className="mb-8">
        <p className="text-xl text-surface-300 font-medium">
          ¡Felicidades al ganador del sorteo!
        </p>
      </motion.div>

      {/* Continue Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={onReset}
          size="lg"
          variant="default"
          className="px-8 py-3 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 border-0 flex items-center gap-3"
        >
          <ArrowRight className="w-5 h-5" />
          Continuar Sorteo
        </Button>
      </motion.div>

      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}