import { Combobox } from "@/components/ui/primitives/combobox";

interface ComboboxWithPreviewProps {
  value: string;
  onChange: (value: string) => void;
  data: { label: string; value: string }[];
  placeholder?: string;
  preview?: string;
  previewAlt?: string;
  variant?: "default" | "orange" | "wingull";
  disabled?: boolean;
  className?: string;
  previewSize?: number;
  fallbackText?: string;
}

export function ComboboxWithPreview({ 
  value, 
  onChange, 
  data,
  placeholder = "Select an option",
  preview,
  previewAlt = "Preview",
  variant = "default",
  disabled = false,
  className,
  previewSize = 40,
  fallbackText = "?"
}: ComboboxWithPreviewProps) {
  const isNothingSelected = value === "0" || !preview;

  return (
    <div className="flex items-center">
      <Combobox 
        variant={variant}
        data={data}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`flex-grow ${className || ''}`}
      />
      {!isNothingSelected && preview ? (
        <img
          width={previewSize}
          height={previewSize}
          src={preview}
          alt={previewAlt}
          className="ml-2"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div 
          className="ml-2 bg-surface-600 border border-surface-500 rounded flex items-center justify-center text-surface-400 text-xs"
          style={{ width: previewSize, height: previewSize }}
        >
          {fallbackText}
        </div>
      )}
    </div>
  );
}