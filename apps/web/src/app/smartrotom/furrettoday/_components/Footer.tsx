import Link from "next/link";
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
      <div className="ft-wrap-wide" style={{ padding: "48px 24px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
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
          <p className="ft-body" style={{ color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 360 }}>
            El semanario pop de la comunidad Pokémon hispanohablante. Hecho a tinta y a píxeles desde BoffMedia.
          </p>
        </div>

        <div>
          <div className="ft-eyebrow" style={{ color: "var(--ft-pink)", marginBottom: 12 }}>Secciones</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {[
              { href: "/smartrotom/furrettoday", label: "Portada" },
              { href: "/smartrotom/furrettoday/editar", label: "Editar" },
              { href: "/smartrotom", label: "SmartRotom" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} style={{ color: "#fff", fontFamily: "var(--ft-font-ui)", fontWeight: 600 }}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="ft-eyebrow" style={{ color: "var(--ft-pink)", marginBottom: 12 }}>Boffmedia</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {["SmartRotom", "Wingull", "BattleSim", "Comunidad"].map((x) => (
              <li key={x}>
                <span style={{ color: "#fff", fontFamily: "var(--ft-font-ui)", fontWeight: 600 }}>{x}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="ft-eyebrow" style={{ color: "var(--ft-pink)", marginBottom: 12 }}>Aviso</div>
          <p className="ft-body" style={{ color: "rgba(255,255,255,0.75)", margin: 0, fontSize: 14 }}>
            Las noticias de Furret Today son ficción dentro del ecosistema SmartRotom/BoffMedia.
          </p>
        </div>
      </div>
      <div style={{ borderTop: "2px dashed rgba(255,255,255,0.2)" }}>
        <div className="ft-wrap-wide" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span className="ft-meta" style={{ color: "rgba(255,255,255,0.6)" }}>© 2026 Furret Today · BoffMedia · Hecho con ♥ en Madrid</span>
          <span className="ft-meta" style={{ color: "rgba(255,255,255,0.6)" }}>«Las mejores noticias dibujadas a papel y tinta»</span>
        </div>
      </div>
    </footer>
  );
}
