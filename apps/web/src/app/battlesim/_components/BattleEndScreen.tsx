"use client"
import { Battle } from "@pkmn/client";
import { useTranslations } from "next-intl";
import { getParticipantName } from "../_utils/replayUtils";

const RESULT_ACCENT: Record<'win' | 'loss' | 'tie', string> = {
  win: 'var(--emerald-400)',
  loss: 'var(--rose-500)',
  tie: 'var(--amber-400)',
};

function TeamDots({ team, accent }: { team: { fainted?: boolean }[]; accent: string }) {
  return (
    <span className="flex gap-1">
      {team.map((p, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={
            p.fainted
              ? { background: 'transparent', border: '1px solid rgba(255,255,255,.3)' }
              : { background: accent, boxShadow: `0 0 6px ${accent}` }
          }
        />
      ))}
    </span>
  );
}

export const BattleEndScreen = ({ battle, pov, username, onRestart }: {
  battle: Battle,
  pov: 0 | 1 | any,
  username?: string | null,
  onRestart?: () => void
}) => {
  const t = useTranslations('battlesim');
  const p1 = pov === 0 ? battle.p1 : battle.p2;
  const p2 = pov === 0 ? battle.p2 : battle.p1;

  const p1Name = getParticipantName(p1.name)
  const p2Name = getParticipantName(p2.name)

  let winner: string;
  let result: 'win' | 'loss' | 'tie';

  if (battle.winner) {
    const winnerName = getParticipantName(battle.winner);
    winner = winnerName.trim();
    const myName = username?.trim() || (pov === 0 ? battle.p1.name : battle.p2.name);
    result = winner === myName ? 'win' : 'loss';
  } else {
    const p1HasPokemon = p1.team.some(p => !p.fainted);
    const p2HasPokemon = p2.team.some(p => !p.fainted);
    if (p1HasPokemon && !p2HasPokemon) {
      winner = p1Name;
      result = pov === 0 ? 'win' : 'loss';
    } else if (!p1HasPokemon && p2HasPokemon) {
      winner = p2Name;
      result = pov === 0 ? 'loss' : 'win';
    } else {
      winner = "__tie__";
      result = 'tie';
    }
  }

  const accent = RESULT_ACCENT[result];
  const resultText = result === 'win' ? t('end.victory') : result === 'tie' ? t('end.tie') : t('end.defeat');

  const trainerPanel = (name: string, side: typeof p1, slot: 1 | 2) => {
    const isWinner = winner === name && result !== 'tie';
    return (
      <div
        className={`end-panel relative flex flex-col gap-2 px-6 py-4 min-w-[200px] max-w-[280px] ${slot === 1 ? 'end-panel--left' : 'end-panel--right'}`}
        style={{
          background: isWinner
            ? `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, rgba(10,10,15,.92)), rgba(10,10,15,.92))`
            : 'rgba(10,10,15,.85)',
          border: `1px solid ${isWinner ? accent : 'rgba(255,255,255,.12)'}`,
          boxShadow: isWinner ? `0 0 32px -10px ${accent}, inset 0 0 24px -18px ${accent}` : 'none',
          clipPath: slot === 1
            ? 'polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%)'
            : 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)',
        }}
      >
        {isWinner && (
          <span
            className="absolute -top-3 left-4 font-mono font-bold text-t-4xs tracking-[.2em] px-2 py-0.5 uppercase"
            style={{ background: accent, color: '#06070b', clipPath: 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
          >
            {t('end.winner')}
          </span>
        )}
        <div
          className="w-20 h-20 rounded-[var(--radius)] overflow-hidden grid place-items-center shrink-0"
          style={{
            background: `center / cover url(/battlesim/trainers/${name.toLowerCase()}.png), var(--surface-2)`,
            border: `2px solid ${isWinner ? accent : 'rgba(255,255,255,.15)'}`,
          }}
        >
          <span className="font-display text-3xl font-extrabold text-white/60">{name.charAt(0)}</span>
        </div>
        <span className="font-display font-extrabold text-t-lg text-white truncate" title={name}>{name}</span>
        <TeamDots team={side.team} accent={isWinner ? accent : 'var(--cyan-400)'} />
      </div>
    );
  };

  return (
    <div
      id="battle-end-screen"
      className="relative flex flex-col items-center justify-center w-full h-full cursor-pointer overflow-hidden select-none"
      onClick={onRestart}
    >
      {/* Dim + scanlines */}
      <div className="absolute inset-0 z-0" style={{ background: 'rgba(4,4,8,.78)' }} />
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{ background: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.025) 3px 4px)' }}
      />

      {/* Result-colored diagonal beams */}
      <div
        className="end-beam absolute -inset-x-1/4 top-[18%] h-16 z-0 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 35%, transparent), transparent)`, transform: 'rotate(-4deg)' }}
      />
      <div
        className="end-beam end-beam--slow absolute -inset-x-1/4 bottom-[20%] h-10 z-0 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 22%, transparent), transparent)`, transform: 'rotate(3deg)' }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center 32%, color-mix(in srgb, ${accent} 18%, transparent), transparent 60%)` }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 w-full px-6">
        {/* Banner */}
        <div className="end-banner relative text-center">
          <div
            className="font-display font-black italic uppercase text-5xl md:text-7xl tracking-[.06em]"
            style={{ color: accent, textShadow: `0 0 28px ${accent}, 0 2px 0 rgba(0,0,0,.6)` }}
          >
            {resultText}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 font-display font-black italic uppercase text-5xl md:text-7xl tracking-[.06em] blur-[6px] opacity-50"
            style={{ color: accent, transform: 'translate(3px, 2px)' }}
          >
            {resultText}
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="end-stats flex items-center gap-3 font-mono text-t-xs px-4 py-1.5 rounded-[var(--radius-pill)]"
          style={{ background: 'rgba(10,10,15,.8)', border: '1px solid rgba(255,255,255,.12)', color: 'var(--text-muted)' }}
        >
          <span className="uppercase tracking-[.12em]">{t('end.turn', { turn: battle.turn })}</span>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <span className="tabular-nums">{p1.team.filter(p => !p.fainted).length}–{p2.team.filter(p => !p.fainted).length}</span>
        </div>

        {/* Trainer face-off */}
        <div className="end-faceoff flex items-stretch justify-center gap-2 md:gap-6 w-full max-w-2xl">
          {trainerPanel(p1Name, p1, 1)}
          <div className="flex flex-col items-center justify-center shrink-0 px-1">
            <span
              className="font-display font-black italic text-3xl md:text-5xl"
              style={{ color: accent, textShadow: `0 0 18px ${accent}`, transform: 'rotate(-6deg)' }}
            >
              {result !== 'tie' ? 'KO' : '='}
            </span>
          </div>
          {trainerPanel(p2Name, p2, 2)}
        </div>

        {/* CTA */}
        <button
          className="end-cta bsx-focus font-display font-bold uppercase tracking-[.14em] text-t-sm px-10 py-3 cursor-pointer transition-transform duration-[var(--dur-fast)] hover:scale-[1.04] active:scale-[.98]"
          style={{
            background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #000))`,
            color: '#06070b',
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            boxShadow: `0 0 28px -8px ${accent}`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRestart && onRestart();
          }}
        >
          {t('end.backToStart')}
        </button>
      </div>

      <style jsx>{`
        .end-banner { animation: end-pop 0.55s var(--ease) both; }
        .end-stats { animation: end-rise 0.5s var(--ease) 0.18s both; }
        .end-faceoff { animation: end-rise 0.5s var(--ease) 0.3s both; }
        .end-cta { animation: end-rise 0.5s var(--ease) 0.45s both; }
        .end-beam { animation: end-beam-sweep 2.6s var(--ease) infinite alternate; }
        .end-beam--slow { animation-duration: 3.4s; }

        @keyframes end-pop {
          0% { opacity: 0; transform: scale(1.35); filter: blur(8px); }
          60% { opacity: 1; transform: scale(0.96); filter: none; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes end-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes end-beam-sweep {
          from { opacity: 0.4; transform: translateX(-4%) rotate(-4deg); }
          to { opacity: 1; transform: translateX(4%) rotate(-4deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .end-banner, .end-stats, .end-faceoff, .end-cta, .end-beam {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default BattleEndScreen;
