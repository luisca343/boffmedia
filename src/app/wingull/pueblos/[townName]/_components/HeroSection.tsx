import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  townName: string;
  color: string;
  frasebonita: string;
  descripcion: string;
}

export default function HeroSection({ townName, color, frasebonita, descripcion }: HeroSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="wform-pueblo-img relative h-[70vh] rounded-lg overflow-hidden mb-12"
    >
      <Image
        src={`/smartrotom/img/pueblos/${townName}/fondo.png`}
        alt={`Vista panorámica de ${townName}`}
        layout="fill"
        objectFit="cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-5xl font-bold" 
          style={{ color: color }}
        >
          Pueblo
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-7xl font-bold text-white mb-4"
        >
          {townName.toUpperCase()}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-3xl font-bold" 
          style={{ color: color }}
        >
          {frasebonita}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-6 text-xl text-white max-w-3xl mx-auto"
        >
          {descripcion}
        </motion.div>
      </div>
    </motion.div>
  );
}