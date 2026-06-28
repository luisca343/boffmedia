import { Trophy, Lock, Medal } from "lucide-react"
import { getRarityTokens } from "./rarityTokens"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementLike {
  id: number
  name: string
  description?: string
  icon?: string | null
  points: number
  rarity?: string | null
  hidden?: boolean
  itemType?: "achievement" | "medal"
  userProgress?: { completedAt?: string | Date | null }
  currentProgress?: number
  maxProgress?: number
}

interface AchievementBadgeProps {
  achievement: AchievementLike
  locked?: boolean
  size?: "sm" | "md"
  showTooltip?: boolean
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 3_600_000) return "Hace unos minutos"
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)}h`
  const days = Math.floor(diff / 86_400_000)
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  return new Date(date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementBadge({
  achievement,
  locked = false,
  size = "md",
  showTooltip = true,
}: AchievementBadgeProps) {
  const tokens = getRarityTokens(achievement.rarity)
  const dim = size === "sm" ? "w-12 h-12" : "w-16 h-16"
  const iconDim = size === "sm" ? "w-7 h-7" : "w-10 h-10"
  const DefaultIcon = achievement.itemType === "medal" ? Medal : Trophy

  return (
    <div className="group relative flex-shrink-0">
      {/* Tile */}
      <div
        className={`${dim} rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110`}
        style={
          locked
            ? { background: "rgba(30,41,59,0.7)", border: "1px solid rgba(71,85,105,0.4)" }
            : { background: tokens.bg, border: `1px solid ${tokens.border}` }
        }
      >
        {locked ? (
          <>
            {achievement.icon ? (
              <img src={achievement.icon} alt="" className={`${iconDim} opacity-25 grayscale`} />
            ) : (
              <DefaultIcon
                className={size === "sm" ? "w-5 h-5" : "w-7 h-7"}
                style={{ color: "rgba(71,85,105,0.6)" }}
              />
            )}
            <div className="absolute inset-0 rounded-lg flex items-center justify-center">
              <Lock
                className={size === "sm" ? "w-4 h-4" : "w-5 h-5"}
                style={{ color: "rgba(100,116,139,0.7)" }}
              />
            </div>
          </>
        ) : achievement.icon ? (
          <img src={achievement.icon} alt="" className={`${iconDim} rounded-md`} />
        ) : (
          <DefaultIcon
            className={size === "sm" ? "w-5 h-5" : "w-7 h-7"}
            style={{ color: tokens.color }}
          />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none"
          style={{ minWidth: "200px" }}
        >
          <div
            className="rounded-lg p-3 shadow-xl"
            style={{
              background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
              border: `1px solid ${locked ? "rgba(71,85,105,0.4)" : tokens.border}`,
            }}
          >
            <p
              className="text-sm font-bold mb-1"
              style={{ color: locked ? "rgba(148,163,184,0.8)" : "rgb(226,232,240)" }}
            >
              {achievement.name}
            </p>
            <p className="text-xs text-ink-muted mb-2 leading-snug">
              {achievement.hidden ? "Descripción oculta" : achievement.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Points chip */}
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{
                  color: "rgba(251,146,60,0.9)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  background: "rgba(249,115,22,0.07)",
                }}
              >
                {achievement.points} pts
              </span>
              {/* Rarity chip */}
              {achievement.rarity && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide"
                  style={{ color: tokens.color, border: `1px solid ${tokens.border}`, background: tokens.bg }}
                >
                  {tokens.label}
                </span>
              )}
            </div>
            {/* Progress (locked with partial progress) */}
            {locked && (achievement.currentProgress ?? 0) > 0 && achievement.maxProgress && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span style={{ color: "rgba(100,116,139,0.7)" }}>Progreso</span>
                  <span style={{ color: "rgba(168,85,247,0.9)" }}>
                    {achievement.currentProgress}/{achievement.maxProgress}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(71,85,105,0.4)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((achievement.currentProgress ?? 0) / achievement.maxProgress) * 100}%`,
                      background: "rgba(168,85,247,0.7)",
                    }}
                  />
                </div>
              </div>
            )}
            {/* Unlock date */}
            {!locked && achievement.userProgress?.completedAt && (
              <p className="text-[10px] font-mono mt-2" style={{ color: "rgba(132,204,22,0.8)" }}>
                {relativeTime(achievement.userProgress.completedAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
