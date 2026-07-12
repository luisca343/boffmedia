import * as React from "react";

export interface IconProps {
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

function Svg({ size = 18, stroke = 1.6, className = "", style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"ico " + className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const I = {
  home:     (p: IconProps) => <Svg {...p}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /></Svg>,
  card:     (p: IconProps) => <Svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /></Svg>,
  list:     (p: IconProps) => <Svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Svg>,
  send:     (p: IconProps) => <Svg {...p}><path d="M22 3 11 14" /><path d="M22 3l-6 18-4-8-8-4 18-6Z" /></Svg>,
  bill:     (p: IconProps) => <Svg {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h4" /></Svg>,
  chart:    (p: IconProps) => <Svg {...p}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 6-7" /></Svg>,
  cal:      (p: IconProps) => <Svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></Svg>,
  search:   (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>,
  bell:     (p: IconProps) => <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21a2 2 0 0 0 4 0" /></Svg>,
  gear:     (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Svg>,
  plus:     (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  arrL:     (p: IconProps) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>,
  arrR:     (p: IconProps) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>,
  arrD:     (p: IconProps) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>,
  arrU:     (p: IconProps) => <Svg {...p}><path d="M6 15l6-6 6 6" /></Svg>,
  arrUR:    (p: IconProps) => <Svg {...p}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></Svg>,
  arrDR:    (p: IconProps) => <Svg {...p}><path d="M7 7l10 10" /><path d="M17 7v10H7" /></Svg>,
  arrows:   (p: IconProps) => <Svg {...p}><path d="M7 7h11l-3-3M17 17H6l3 3" /></Svg>,
  qrcode:   (p: IconProps) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v3M14 21h3M21 17v4" /></Svg>,
  filter:   (p: IconProps) => <Svg {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" /></Svg>,
  sort:     (p: IconProps) => <Svg {...p}><path d="M3 6h13M3 12h9M3 18h5M17 8V20l-3-3M17 8l3 3" /></Svg>,
  more:     (p: IconProps) => <Svg {...p}><circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" /></Svg>,
  x:        (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>,
  check:    (p: IconProps) => <Svg {...p}><path d="M5 12l5 5 9-11" /></Svg>,
  shield:   (p: IconProps) => <Svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" /></Svg>,
  sparkles: (p: IconProps) => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M16 8l2.5-2.5M5.5 18.5 8 16" /></Svg>,
  zap:      (p: IconProps) => <Svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Svg>,
  bag:      (p: IconProps) => <Svg {...p}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></Svg>,
  heart:    (p: IconProps) => <Svg {...p}><path d="M12 21s-7-4.5-9.5-9C.5 8 4 4 7.5 5.5 9.7 6.4 11 8 12 9.5 13 8 14.3 6.4 16.5 5.5 20 4 23.5 8 21.5 12c-2.5 4.5-9.5 9-9.5 9Z" /></Svg>,
  trophy:   (p: IconProps) => <Svg {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M4 5h4v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5ZM16 5h4v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5ZM10 14h4v3h-4zM7 21h10" /></Svg>,
  gift:     (p: IconProps) => <Svg {...p}><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12M8 9a3 3 0 0 1-3-3 2 2 0 0 1 4-1l3 4M16 9a3 3 0 0 0 3-3 2 2 0 0 0-4-1l-3 4" /></Svg>,
  receipt:  (p: IconProps) => <Svg {...p}><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" /><path d="M9 7h6M9 11h6M9 15h4" /></Svg>,
  user:     (p: IconProps) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></Svg>,
  shieldOk: (p: IconProps) => <Svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" /></Svg>,
  info:     (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></Svg>,
  alert:    (p: IconProps) => <Svg {...p}><path d="M12 3l10 18H2L12 3Z" /><path d="M12 10v4M12 17h.01" /></Svg>,
  copy:     (p: IconProps) => <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>,
  eye:      (p: IconProps) => <Svg {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>,
  eyeOff:   (p: IconProps) => <Svg {...p}><path d="M3 3l18 18" /><path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.4 4M6.1 6.1C3.6 7.7 2 12 2 12s4 7 10 7c1.6 0 3-.3 4.4-.9" /></Svg>,
  bot:      (p: IconProps) => <Svg {...p}><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M9 12h.01M15 12h.01M12 3v4M8 20v2M16 20v2" /></Svg>,
  download: (p: IconProps) => <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg>,
  scan:     (p: IconProps) => <Svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M3 12h18" /></Svg>,
  menu:     (p: IconProps) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>,
};

export type IconName = keyof typeof I;

/** Render an icon by name (compile-checked — a typo is a type error). */
export function Ico({ name, ...p }: IconProps & { name: IconName }) {
  const C = I[name];
  return <C {...p} />;
}
