import Image from "next/image";

function MarqueeBanner() {
  const items = Array.from({ length: 14 });
  return (
    <div className="ft-marquee" style={{ background: "var(--ft-pink)", borderColor: "var(--ft-ink)" }}>
      <div className="ft-marquee__track">
        {items.map((_, i) => (
          <span key={i} className="ft-marquee__item" style={{ color: "#fff" }}>
            <span className="ft-marquee__sep" style={{ background: "var(--ft-yellow)" }}></span>
            FURRET TODAY · SEMANARIO POP
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FurretFooter() {
  return (
    <footer style={{ background: "var(--ft-ink)", color: "var(--ft-paper)", marginTop: 64 }}>
      <MarqueeBanner />
      <div className="ft-wrap-wide" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
            <Image
              src="/smartrotom/img/apps/furrettoday/furret2.png"
              alt="Furret mascot"
              fill
              className="object-contain"
            />
          </div>
          <span className="ft-display" style={{ fontSize: 28, color: "var(--ft-yellow)" }}>
            FURRET<span style={{ color: "var(--ft-pink)" }}>·</span>TODAY
          </span>
        </div>
        <p className="ft-body" style={{ color: "rgba(255,255,255,0.75)", margin: "0 auto", maxWidth: 480 }}>
          El semanario pop de la comunidad Pokémon hispanohablante. Hecho a tinta y a píxeles desde BoffMedia.
        </p>
        <p className="ft-body" style={{ color: "rgba(255,255,255,0.4)", margin: "24px auto 0", fontSize: 14, maxWidth: 480 }}>
          Las noticias de Furret Today son ficción dentro del ecosistema SmartRotom/BoffMedia.
        </p>
      </div>
      <div style={{ borderTop: "2px dashed rgba(255,255,255,0.15)" }}>
        <div className="ft-wrap-wide" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span className="ft-meta" style={{ color: "rgba(255,255,255,0.5)" }}>© 2026 Furret Today · BoffMedia · Hecho con ♥ en Teras</span>
          <span className="ft-meta" style={{ color: "rgba(255,255,255,0.5)" }}>«Juntos siempre podremos CA-MI-NAR»</span>
        </div>
      </div>
    </footer>
  );
}
