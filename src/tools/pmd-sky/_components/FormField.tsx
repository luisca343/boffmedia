import { Badge } from "@/components/ui/badge";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export function FormField({ 
  label, 
  children, 
  className, 
  icon, 
  required, 
  disabled 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className={`block text-base font-medium mb-3 transition-colors ${
        disabled ? 'text-surface-500' : 'text-surface-200'
      }`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
          {disabled && <Badge variant="outline" className="text-xs">Disabled</Badge>}
        </div>
      </label>
      {children}
    </div>
  );
}
