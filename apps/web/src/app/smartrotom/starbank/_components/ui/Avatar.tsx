"use client";
import * as React from "react";
import { accountImageUrl, AVATAR_FALLBACK, accountColor, initials } from "../../_utils/account";
import type { SBAccount } from "../../_types";

interface AvatarProps {
  name?: string;
  src?: string;
  initials?: string;
  color?: string;
  size?: number;
  square?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

/** Presentational avatar — image (pixelated) or initials monogram. */
export function Avatar({ name, src, initials: ini, color, size = 36, square = false, className = "", style, onError }: AvatarProps) {
  const radius = square ? 8 : 999;
  if (src) {
    return (
      <span
        className={"inline-block shrink-0 overflow-hidden " + className}
        style={{ width: size, height: size, borderRadius: radius, background: color || "#dbeafe", ...style }}
      >
        <img
          src={src}
          alt={name || ""}
          width={size}
          height={size}
          onError={onError}
          className="block h-full w-full object-cover [image-rendering:pixelated]"
        />
      </span>
    );
  }
  const label = ini || (name ? name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() : "?");
  return (
    <span
      className={"inline-grid shrink-0 place-items-center font-bold text-white " + className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color || "#93c5fd",
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16)",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/** Resolves the real image URL and degrades: SECONDARY → initials, MAIN → fallback head. */
export function EntityAvatar({ type, name, image, size = 36, square = false, id }: { type?: string; name?: string; image?: string; size?: number; square?: boolean; id?: number | string }) {
  const [errored, setErrored] = React.useState(false);
  const url = accountImageUrl(type, name, image);
  React.useEffect(() => setErrored(false), [url]);

  if (errored) {
    if (type === "SECONDARY") {
      return <Avatar initials={initials(name)} color={accountColor(id ?? name ?? "")} size={size} square={square} />;
    }
    return <Avatar src={AVATAR_FALLBACK} name={name} size={size} square={square} />;
  }
  return <Avatar src={url} name={name} size={size} square={square} onError={() => setErrored(true)} />;
}

export function AccountAvatar({ account, size = 36, square = false }: { account?: SBAccount; size?: number; square?: boolean }) {
  if (!account) return null;
  return <EntityAvatar type={account.type} name={account.name} image={account.image} id={account.id} size={size} square={square} />;
}

export function ContactAvatar({ name, type, image, id, size = 36 }: { name?: string; type?: string; image?: string; id?: number | string; size?: number }) {
  return <EntityAvatar type={type} name={name} image={image} id={id} size={size} />;
}
