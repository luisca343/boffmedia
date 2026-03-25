import { motion } from "framer-motion";
import { Button } from "@/components/ui/primitives/button";

interface ActionButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "generate";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function ActionButton({ 
  onClick, 
  variant = "primary",
  size = "md",
  icon,
  endIcon,
  loading,
  disabled,
  children,
  className,
  fullWidth = false
}: ActionButtonProps) {
  const variantStyles = {
    primary: "bg-gradient-to-r from-secondary-500 via-cyan-500 to-secondary-600 hover:from-secondary-600 hover:via-cyan-600 hover:to-secondary-700",
    secondary: "bg-surface-700 hover:bg-surface-600",
    success: "bg-gradient-to-r from-highlight-500 to-emerald-600 hover:from-highlight-600 hover:to-emerald-700",
    warning: "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
    generate: "bg-gradient-to-r from-secondary-500 via-cyan-500 to-secondary-600 hover:from-secondary-600 hover:via-cyan-600 hover:to-secondary-700"
  };

  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-6 px-8 text-lg"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={fullWidth ? "w-full" : ""}
    >
      <Button 
        onClick={onClick}
        disabled={disabled || loading}
        size={size === "lg" ? "lg" : "default"}
        className={`
          ${variantStyles[variant]} 
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          text-white border-0 shadow-lg hover:shadow-xl 
          transition-all duration-300 font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        ) : icon && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {endIcon && <span className="ml-2">{endIcon}</span>}
      </Button>
    </motion.div>
  );
}
