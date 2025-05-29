import { motion } from "framer-motion"
import { Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WinnerDisplayProps {
  winner: string
  onReset: () => void
}

export default function WinnerDisplay({ winner, onReset }: WinnerDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 20
      }}
      className="flex flex-col items-center justify-center text-center py-10"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="relative mb-6"
      >
        <Trophy className="h-24 w-24 text-yellow-500" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-20 z-0"
        />
      </motion.div>
      
      <h2 className="text-3xl font-bold mb-2 text-primary-300">¡Tenemos un ganador!</h2>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary-900/70 to-blue-900/70 p-6 rounded-xl border-2 border-primary-500/50 shadow-lg my-6 max-w-lg w-full"
      >
        <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 break-words">
          {winner}
        </h3>
      </motion.div>
      
      <motion.div 
        className="absolute top-6 left-6 text-primary-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <Trophy className="h-8 w-8" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-6 right-6 text-yellow-500"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <Trophy className="h-8 w-8" />
      </motion.div>
      
      <motion.div 
        className="absolute top-6 right-6 text-blue-400"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Trophy className="h-8 w-8" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-6 left-6 text-green-400"
        animate={{ scale: [1, 1.2, 1], rotate: 45 }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Trophy className="h-8 w-8" />
      </motion.div>
      
      <p className="text-surface-300 mb-8">
        ¡Felicidades al ganador del sorteo!
      </p>
      
      <Button 
        onClick={onReset} 
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium"
      >
        Continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  )
}