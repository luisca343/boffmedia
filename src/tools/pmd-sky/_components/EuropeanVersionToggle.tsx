import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface EuropeanVersionToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function EuropeanVersionToggle({ 
  checked, 
  onChange 
}: EuropeanVersionToggleProps) {
  const t = useTranslations("");

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-surface-700/40 to-surface-800/40 border border-surface-600/30 hover:border-primary-500/40 transition-all duration-300">
        
        {/* Left side with flag and text */}
        <div className="flex items-center gap-4">
          <motion.div 
            className="text-2xl"
            animate={{ rotate: checked ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            🇪🇺
          </motion.div>
          <div>
            <span className="text-lg font-medium text-surface-100 group-hover:text-primary-300 transition-colors">
              {t("EUROPEAN_VERSION")}
            </span>
            <div className="text-sm text-surface-400">
              {checked ? 'Formato EU activado' : 'Formato internacional'}
            </div>
          </div>
        </div>

        {/* Right side with toggle */}
        <motion.div
          className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${
            checked 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
              : 'bg-surface-600'
          }`}
          animate={{
            boxShadow: checked 
              ? '0 0 20px rgba(59, 130, 246, 0.3)' 
              : '0 0 0px rgba(0, 0, 0, 0)'
          }}
        >
          <motion.div
            className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-xs"
            animate={{
              x: checked ? 32 : 0,
              rotate: checked ? 360 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {checked ? '✓' : '○'}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
