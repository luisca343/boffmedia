import { motion } from "framer-motion";

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "feature" | "setting";
}

export function AnimatedToggle({ 
  checked, 
  onChange,
  label,
  description,
  icon,
  disabled = false,
  size = "md",
  variant = "default"
}: AnimatedToggleProps) {
  const sizes = {
    sm: { toggle: "w-12 h-6", knob: "w-4 h-4", translate: 24 },
    md: { toggle: "w-16 h-8", knob: "w-6 h-6", translate: 32 },
    lg: { toggle: "w-20 h-10", knob: "w-8 h-8", translate: 40 }
  };

  const gradients = {
    default: "from-secondary-500 to-cyan-500",
    feature: "from-accent-500 to-pink-500",
    setting: "from-highlight-500 to-emerald-500"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`group cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-surface-700/40 to-surface-800/40 border border-surface-600/30 hover:border-primary-500/40 transition-all duration-300">
        
        <div className="flex items-center gap-4">
          {icon && (
            <motion.div 
              className="text-2xl"
              animate={{ rotate: checked ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              {icon}
            </motion.div>
          )}
          <div>
            <span className="text-lg font-medium text-surface-100 group-hover:text-primary-300 transition-colors">
              {label}
            </span>
            {description && (
              <div className="text-sm text-surface-400">
                {description}
              </div>
            )}
          </div>
        </div>

        <motion.div
          className={`${sizes[size].toggle} rounded-full p-1 transition-all duration-300 ${
            checked 
              ? `bg-gradient-to-r ${gradients[variant]}` 
              : 'bg-surface-600'
          }`}
          animate={{
            boxShadow: checked 
              ? '0 0 20px rgba(59, 130, 246, 0.3)' 
              : '0 0 0px rgba(0, 0, 0, 0)'
          }}
        >
          <motion.div
            className={`${sizes[size].knob} bg-white rounded-full shadow-md flex items-center justify-center text-xs`}
            animate={{
              x: checked ? sizes[size].translate : 0,
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
