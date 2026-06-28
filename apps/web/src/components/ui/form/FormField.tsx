import { Badge } from "@/components/ui/primitives/badge";
import { useTranslations } from "next-intl";

type FormFieldVariant = "default" | "gaming";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  variant?: FormFieldVariant;
}

export function FormField({
  label,
  children,
  className,
  icon,
  required,
  disabled,
  hint,
  variant = "default",
}: FormFieldProps) {
  const t = useTranslations("");

  if (variant === "gaming") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-1 h-1 rounded-full flex-shrink-0 transition-colors"
            style={{ background: disabled ? "rgba(100,116,139,0.4)" : "rgba(34,211,238,0.6)" }}
          />
          {icon}
          <span
            className="text-[10px] uppercase tracking-[0.25em] transition-colors"
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: disabled ? "rgba(100,116,139,0.6)" : "rgba(148,163,184,0.8)",
            }}
          >
            {label}
          </span>
          {required && (
            <span
              className="text-[10px] ml-0.5"
              style={{ color: "rgba(34,211,238,0.7)" }}
            >
              *
            </span>
          )}
          {disabled && (
            <span
              className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ml-auto"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: "rgba(100,116,139,0.7)",
                border: "1px solid rgba(71,85,105,0.35)",
                background: "rgba(15,23,42,0.5)",
              }}
            >
              {t("boffmedia.ui.disabled")}
            </span>
          )}
        </div>
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          {children}
        </div>
        {hint && (
          <p
            className="text-[10px] font-mono mt-1.5 tracking-wide"
            style={{ color: "rgba(100,116,139,0.7)" }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <label className={`block text-base font-medium mb-3 transition-colors ${
        disabled ? 'text-ink-muted' : 'text-ink'
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
        <p className="text-xs text-ink-muted mt-1">{hint}</p>
      )}
    </div>
  );
}