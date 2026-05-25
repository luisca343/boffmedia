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

export function ChartsSkeleton() {
  return (
    <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Shimmer h={28} w={200} radius={8} />
          <Shimmer h={14} w={280} radius={6} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Shimmer h={32} w={220} radius={10} />
          <Shimmer h={32} w={100} radius={10} />
        </div>
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

      {/* Row 1: area chart (8) + activity (4) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div
          className="md:col-span-8"
          style={{
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Shimmer h={14} w={120} radius={6} />
          <Shimmer h={26} w={180} radius={8} />
          <Shimmer h={260} radius={12} />
        </div>
        <div
          className="md:col-span-4"
          style={{
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Shimmer h={14} w={100} radius={6} />
          <Shimmer h={32} w={150} radius={8} />
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginTop: 8 }}>
            {[40, 55, 30, 70, 45, 80, 35, 60, 50, 75, 40, 65, 55, 80].map((h, i) => (
              <Shimmer key={i} h={h} w="100%" radius={4} />
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: bar chart (6) + distribution (6) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div
          className="md:col-span-6"
          style={{
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Shimmer h={14} w={130} radius={6} />
          <Shimmer h={220} radius={12} />
        </div>
        <div
          className="md:col-span-6"
          style={{
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Shimmer h={14} w={160} radius={6} />
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Shimmer h={160} w={160} radius={999} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shimmer h={10} w={10} radius={999} />
                  <Shimmer h={11} w={80} radius={6} />
                  <Shimmer h={11} w={40} radius={6} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
