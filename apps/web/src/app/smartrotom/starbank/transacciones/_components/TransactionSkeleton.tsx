function Shimmer({ h, w, radius = 10 }: { h: number | string; w?: number | string; radius?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w ?? "100%",
        borderRadius: radius,
        background: "var(--sb-surface-3, #eef3fb)",
      }}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Shimmer h={28} w={200} radius={8} />
          <Shimmer h={14} w={260} radius={6} />
        </div>
        <Shimmer h={36} w={100} radius={10} />
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              borderRadius: 14,
              border: "1px solid var(--sb-border, #e3ebf5)",
              background: "var(--sb-surface, #fff)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Shimmer h={12} w={90} radius={6} />
              <Shimmer h={28} w={28} radius={8} />
            </div>
            <Shimmer h={26} w={120} radius={8} />
            <Shimmer h={11} w={70} radius={6} />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--sb-border, #e3ebf5)",
          background: "var(--sb-surface, #fff)",
          overflow: "hidden",
        }}
      >
        {/* Filterbar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--sb-border, #e3ebf5)",
          }}
        >
          <Shimmer h={32} w={60} radius={8} />
          <Shimmer h={32} w={210} radius={10} />
          <Shimmer h={32} w={150} radius={10} />
          <div style={{ marginLeft: "auto" }}>
            <Shimmer h={32} w={200} radius={10} />
          </div>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
            gap: 0,
            padding: "12px 16px",
            background: "var(--sb-surface-2, #f7faff)",
            borderBottom: "1px solid var(--sb-border, #e3ebf5)",
          }}
        >
          {[100, 80, 60, 60, 60].map((w, i) => (
            <Shimmer key={i} h={11} w={w} radius={6} />
          ))}
        </div>

        {/* Table rows */}
        {Array(10).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
              gap: 0,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: i < 9 ? "1px solid var(--sb-border, #e3ebf5)" : "none",
            }}
          >
            {/* Counterparty */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Shimmer h={32} w={32} radius={999} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Shimmer h={13} w={80} radius={6} />
                <Shimmer h={11} w={50} radius={6} />
              </div>
            </div>
            {/* Concepto */}
            <Shimmer h={13} w={120} radius={6} />
            {/* Cantidad */}
            <Shimmer h={13} w={70} radius={6} />
            {/* Saldo */}
            <Shimmer h={13} w={70} radius={6} />
            {/* Fecha */}
            <Shimmer h={13} w={70} radius={6} />
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderTop: "1px solid var(--sb-border, #e3ebf5)",
          }}
        >
          <Shimmer h={13} w={160} radius={6} />
          <div style={{ display: "flex", gap: 8 }}>
            <Shimmer h={32} w={90} radius={8} />
            <Shimmer h={32} w={90} radius={8} />
            <Shimmer h={32} w={100} radius={8} />
          </div>
        </div>
      </div>
    </main>
  );
}
