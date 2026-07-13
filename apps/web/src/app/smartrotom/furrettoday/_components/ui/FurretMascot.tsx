/**
 * The masthead mascot. Pure SVG — it is the app's logo, its empty state and its
 * cover art, so it must scale from 40px in the nav to 420px on the cover
 * without a raster asset.
 */
export function FurretMascot({
  size = 120,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={(size * 200) / 240}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="ft-body-dots"
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.6" fill="rgba(0,0,0,0.18)" />
        </pattern>
      </defs>
      {/* Long body wave */}
      <path
        d="M30 130 C 30 100, 60 80, 90 100 S 140 140, 180 110 S 230 80, 230 110 L 230 150 C 230 170, 200 175, 180 165 S 130 175, 100 165 S 50 175, 30 155 Z"
        fill="#caa46a"
        stroke="#0b0b0f"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Belly */}
      <path
        d="M55 140 C 80 160, 130 155, 170 145 C 190 138, 215 142, 218 152 C 215 168, 165 175, 110 168 C 70 165, 50 158, 55 140 Z"
        fill="#f4dca0"
        stroke="#0b0b0f"
        strokeWidth="2.5"
      />
      {/* Halftone over the body */}
      <path
        d="M30 130 C 30 100, 60 80, 90 100 S 140 140, 180 110 S 230 80, 230 110 L 230 150 C 230 170, 200 175, 180 165 S 130 175, 100 165 S 50 175, 30 155 Z"
        fill="url(#ft-body-dots)"
        opacity="0.6"
      />
      {/* Tail */}
      <path
        d="M225 110 C 235 95, 250 100, 245 120 C 240 138, 220 130, 222 118"
        fill="#caa46a"
        stroke="#0b0b0f"
        strokeWidth="3"
      />
      {/* Stripes */}
      <path
        d="M68 108 C 75 96, 90 96, 94 110"
        stroke="#7c5a2d"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M130 130 C 138 120, 152 121, 156 132"
        stroke="#7c5a2d"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M190 122 C 198 114, 210 116, 212 126"
        stroke="#7c5a2d"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Head */}
      <circle cx="50" cy="105" r="32" fill="#caa46a" stroke="#0b0b0f" strokeWidth="3" />
      <path d="M28 90 C 24 78, 36 70, 42 80" fill="#caa46a" stroke="#0b0b0f" strokeWidth="3" />
      <path d="M58 78 C 62 70, 74 72, 72 84" fill="#caa46a" stroke="#0b0b0f" strokeWidth="3" />
      {/* Inner ear */}
      <path d="M30 84 C 30 78, 36 76, 38 82" fill="#f0b8c6" />
      <path d="M64 78 C 64 73, 70 73, 70 80" fill="#f0b8c6" />
      {/* Face */}
      <ellipse cx="44" cy="108" rx="13" ry="9" fill="#fff" />
      <circle cx="40" cy="100" r="3.2" fill="#0b0b0f" />
      <circle cx="56" cy="100" r="3.2" fill="#0b0b0f" />
      <circle cx="39.5" cy="99" r="1" fill="#fff" />
      <circle cx="55.5" cy="99" r="1" fill="#fff" />
      <ellipse cx="48" cy="113" rx="2.2" ry="1.6" fill="#0b0b0f" />
      <path
        d="M46 116 C 46 121, 51 121, 51 116"
        stroke="#0b0b0f"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheeks */}
      <circle cx="32" cy="113" r="3" fill="#ff7aa8" opacity="0.7" />
      <circle cx="62" cy="113" r="3" fill="#ff7aa8" opacity="0.7" />
    </svg>
  );
}
