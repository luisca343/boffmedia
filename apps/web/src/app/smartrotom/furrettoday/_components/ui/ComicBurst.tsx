import { FT_INK } from "../../_utils/accents";

/** The spiked "POW!" star. Sized in px because it is always an overlay. */
export function ComicBurst({
  size = 200,
  color = "#ffd60a",
  stroke = FT_INK,
  text,
  textColor = FT_INK,
  className,
  style,
}: {
  size?: number;
  color?: string;
  stroke?: string;
  text?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative", ...style }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
        <path
          d="M100 6 L116 38 L150 22 L142 60 L182 60 L154 90 L188 110 L150 120 L168 156 L130 148 L122 188 L100 160 L78 188 L70 148 L32 156 L50 120 L12 110 L46 90 L18 60 L58 60 L50 22 L84 38 Z"
          fill={color}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      {text ? (
        <div
          className="font-ft-display absolute inset-0 flex items-center justify-center text-center leading-none tracking-[0.04em]"
          // Size tracks the burst so the word always fits inside the spikes.
          style={{ color: textColor, fontSize: size * 0.18, padding: "0 16%" }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}
