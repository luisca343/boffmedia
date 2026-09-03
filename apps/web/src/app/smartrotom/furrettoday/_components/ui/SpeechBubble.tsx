/** A comic speech balloon with an ink-outlined tail. */
export function SpeechBubble({
  children,
  fill = "#fff",
  className,
  style,
}: {
  children: React.ReactNode;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <div
        className="border-ft rounded-[20px] border-ft-ink px-[1.125rem] py-3 shadow-ft-pop-sm relative z-[1]"
        style={{ background: fill }}
      >
        {children}
      </div>
      <svg
        width="28"
        height="22"
        viewBox="0 0 28 22"
        className="absolute -bottom-4 left-7"
        aria-hidden="true"
      >
        <path
          d="M2 0 L26 0 L4 20 Z"
          fill={fill}
          stroke="#0b0b0f"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Covers the balloon's own bottom stroke so the tail reads as one shape. */}
        <line x1="3" y1="1" x2="25" y2="1" stroke={fill} strokeWidth="3" />
      </svg>
    </div>
  );
}
