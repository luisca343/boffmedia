export function EventLoadingState() {
  return (
    <div
      className="rounded-xl border p-10 flex flex-col items-center gap-4"
      style={{
        background: "rgba(9,13,27,0.85)",
        borderColor: "rgba(249,115,22,0.15)",
      }}
    >
      {/* Spinner */}
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "rgba(249,115,22,0.6)", borderTopColor: "transparent" }}
      />
      <p className="text-xs font-mono uppercase tracking-widest text-surface-500">
        Cargando eventos...
      </p>

      {/* Skeleton rows */}
      <div className="w-full max-w-xl space-y-2 mt-2">
        {[100, 85, 93].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-lg animate-pulse"
            style={{
              width: `${w}%`,
              background: "rgba(249,115,22,0.05)",
              border: "1px solid rgba(249,115,22,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
