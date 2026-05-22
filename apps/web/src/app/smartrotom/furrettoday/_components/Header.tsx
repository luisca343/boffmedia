import Image from "next/image";
import Link from "next/link";

export default function FurretHeader() {
  return (
    <header style={{ background: "var(--ft-paper)", borderBottom: "var(--ft-border)" }}>
      {/* Masthead */}
      <div className="ft-wrap-wide" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", flexWrap: "nowrap" }}>
        <Link
          href="/smartrotom/furrettoday"
          className="ft-display"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: 0, flexShrink: 0, whiteSpace: "nowrap" }}
        >
          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
            <Image
              src="/smartrotom/img/apps/furrettoday/furret2.png"
              alt="Furret mascot"
              fill
              className="object-contain"
            />
          </div>
          <span style={{ fontSize: 30, letterSpacing: "0.04em", lineHeight: 0.9 }}>
            FURRET<span style={{ color: "var(--ft-pink)" }}>·</span>TODAY
          </span>
        </Link>

        <span className="ft-meta" style={{ opacity: 0.7, whiteSpace: "nowrap", flexShrink: 0 }}>
          SEMANARIO POP
        </span>

        <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }} aria-label="Secciones">
          {[
            { href: "/smartrotom/furrettoday", label: "Portada" },
            { href: "/smartrotom/furrettoday/editar", label: "Editar" },
            { href: "/smartrotom", label: "SmartRotom" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="ft-eyebrow"
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: 0,
                background: "transparent",
                color: "var(--ft-ink)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Sub-bar: decorative strip */}
      <div style={{ borderTop: "1.5px dashed var(--ft-ink)", background: "var(--ft-paper-2)" }}>
        <div className="ft-wrap-wide" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 24px", overflowX: "auto" }}>
          <span className="ft-eyebrow" style={{ color: "var(--ft-pink)", whiteSpace: "nowrap" }}>ÚLTIMA HORA</span>
          <span className="ft-meta" style={{ whiteSpace: "nowrap" }}>Las mejores noticias dibujadas a papel y tinta</span>
        </div>
      </div>
    </header>
  );
}
