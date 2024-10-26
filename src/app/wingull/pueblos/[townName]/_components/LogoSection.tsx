import { motion } from 'framer-motion';

export default function LogoSection() {
  return (
    <div className="wform-logos flex justify-center space-x-8">
      <motion.img 
        src="/smartrotom/img/logos/tomasnook.webp" 
        alt="Tomas Nook" 
        width={150} 
        height={150}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      />
      <motion.img 
        src="/smartrotom/img/logos/constructorasburr.webp" 
        alt="Constructoras Burr" 
        width={150} 
        height={150}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      />
      <motion.img 
        src="/smartrotom/img/logos/wingull2.webp" 
        alt="Wingull" 
        width={150} 
        height={150}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      />
    </div>
  );
}