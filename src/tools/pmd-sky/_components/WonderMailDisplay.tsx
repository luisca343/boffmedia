import { HiMail } from "react-icons/hi";
import { CodeDisplay } from "@/components/display";

interface WonderMailDisplayProps {
  mail: string;
  isEuropean: boolean;
  onCopy: () => void;
  copied: boolean;
}

export function WonderMailDisplay({ 
  mail, 
  isEuropean, 
  onCopy, 
  copied 
}: WonderMailDisplayProps) {
  return (
    <CodeDisplay
      code={mail}
      title={`Wonder Mail ${isEuropean ? "(EU)" : "(US/JP)"}`}
      icon={<HiMail className="w-6 h-6" />}
      badge={{
        text: isEuropean ? "European Version" : "US/Japanese Version",
        variant: "secondary",
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30"
      }}
      onCopy={onCopy}
      copied={copied}
      copyable={true}
    />
  );
}
