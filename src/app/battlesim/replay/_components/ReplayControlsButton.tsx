import { ButtonHTMLAttributes, FC } from "react";

interface ReplayControlsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  label: string;
}

const ReplayControlsButton: FC<ReplayControlsButtonProps> = ({ children, label, ...props }) => {
  return (
    <button
      {...props}
      className={`p-1 px-2  bg-main-600 text-main-50 rounded hover:bg-main-700 focus:outline-none focus:ring-2 focus:ring-main-500 ${props.className}`}
    >
      <div className="flex flex-col items-center">
        {children}
        <span className="text-xs mt-1">{label}</span>
      </div>
    </button>
  );
};

export default ReplayControlsButton;