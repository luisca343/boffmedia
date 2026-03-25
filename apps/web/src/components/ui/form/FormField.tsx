import { Badge } from "@/components/ui/primitives/badge";
import { useTranslations } from "next-intl";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function FormField({ 
  label, 
  children, 
  className, 
  icon, 
  required, 
  disabled,
  hint 
}: FormFieldProps) {
  const t = useTranslations("");

  return (
    <div className={className}>
      <label className={`block text-base font-medium mb-3 transition-colors ${
        disabled ? 'text-surface-500' : 'text-surface-200'
      }`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
          {disabled && <Badge variant="outline" className="text-xs">{t("boffmedia.ui.disabled")}</Badge>}
        </div>
      </label>
      {children}
      {hint && (
        <p className="text-xs text-surface-400 mt-1">{hint}</p>
      )}
    </div>
  );
}