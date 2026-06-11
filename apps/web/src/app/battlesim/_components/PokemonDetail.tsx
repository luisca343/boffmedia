import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives/tabs";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Pokemon } from "@pkmn/client";
import { StatID } from "@pkmn/data";
import { useState } from "react";
import { Activity, Shield, Zap } from "lucide-react";

interface PokemonDetailProps {
    pokemon: Pokemon;
    children: React.ReactNode;
    className?: string;
    key?: string;
    offset?: number;
    showFullInfo?: boolean;
}

const tabBtn: React.CSSProperties = {
    background: "var(--surface-2)",
    color: "var(--text-dim)",
    border: "none",
    fontSize: "var(--text-xs)",
    padding: "var(--bsx-pad-chip) var(--bsx-pad-sm)",
    cursor: "pointer",
    transition: "color var(--dur-fast), background var(--dur-fast)",
};
const tabBtnActive: React.CSSProperties = {
    ...tabBtn,
    background: "var(--card-bg)",
    color: "var(--text)",
};

export default function PokemonDetail({
    pokemon,
    children,
    className,
    offset = 20,
    showFullInfo = false,
}: PokemonDetailProps) {
    const [activeTab, setActiveTab] = useState("info");

    let types;
    try {
        types = pokemon.types;
    } catch (error) {
        return <>{children}</>;
    }
    if (!pokemon || !types) return <>{children}</>;

    const isOpponent = pokemon.side.n === 1;
    const showDetailedInfo = showFullInfo || !isOpponent;

    const hpPct = pokemon.hp > 0 ? (pokemon.hp / pokemon.maxhp) * 100 : 0;
    const hpColor =
        hpPct > 50
            ? "var(--emerald-400)"
            : hpPct > 20
            ? "var(--amber-400)"
            : "var(--red-500)";

    const stats = ["hp", "atk", "def", "spa", "spd", "spe"] as StatID[];
    const hasBoosts = Object.keys(pokemon.boosts).length > 0;

    return (
        <HoverCard key={pokemon.name} openDelay={100} closeDelay={100}>
            <HoverCardTrigger className={className}>{children}</HoverCardTrigger>
            <HoverCardContent
                side="right"
                align="start"
                className="w-[280px] p-0 overflow-hidden"
                style={{
                    background: "var(--card-bg)",
                    border: "var(--card-border)",
                    color: "var(--text)",
                    borderRadius: "var(--radius-lg)",
                }}
            >
                {/* Header */}
                <div
                    className="p-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex justify-between items-baseline">
                        <span className="font-display font-extrabold text-t-base">
                            {pokemon.name}
                        </span>
                        <span
                            className="font-mono text-t-xs"
                            style={{ color: "var(--text-dim)" }}
                        >
                            {pokemon.speciesForme} L{pokemon.level}
                        </span>
                    </div>

                    <div className="flex mt-1 gap-1">
                        {types.map((type) => (
                            <TypeBadgeSmall key={type} type={type} />
                        ))}
                        {pokemon.teraType && pokemon.isTerastallized && (
                            <div className="flex items-center ml-2 gap-1">
                                <span
                                    className="text-t-xs"
                                    style={{ color: "var(--text-dim)" }}
                                >
                                    Tera:
                                </span>
                                <TypeBadgeSmall
                                    key={pokemon.teraType}
                                    type={pokemon.teraType}
                                />
                            </div>
                        )}
                    </div>

                    {/* HP */}
                    <div className="mt-2">
                        <div
                            className="flex justify-between text-t-xs mb-1"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <span>
                                HP: {hpPct.toFixed(1)}%
                            </span>
                            {showDetailedInfo && (
                                <span>
                                    {pokemon.hp}/{pokemon.maxhp}
                                </span>
                            )}
                        </div>
                        <div
                            className="w-full h-2 rounded-full"
                            style={{ background: "var(--surface-3)" }}
                        >
                            <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                    width: `${hpPct}%`,
                                    background: hpColor,
                                    boxShadow: `0 0 8px -2px ${hpColor}`,
                                }}
                            />
                        </div>
                    </div>

                    {pokemon.status && (
                        <div
                            className="mt-2 py-1 px-2 rounded text-center text-t-xs font-semibold"
                            style={{
                                background: getStatusColor(pokemon.status).bg,
                                color: getStatusColor(pokemon.status).text,
                            }}
                        >
                            {getStatusName(pokemon.status)}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <Tabs
                    defaultValue="info"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList
                        className="grid grid-cols-3 h-9 rounded-none"
                        style={{ background: "var(--surface)" }}
                    >
                        <TabsTrigger
                            value="info"
                            style={activeTab === "info" ? tabBtnActive : tabBtn}
                        >
                            <Activity className="h-3.5 w-3.5 mr-1" />
                            Info
                        </TabsTrigger>
                        <TabsTrigger
                            value="stats"
                            style={activeTab === "stats" ? tabBtnActive : tabBtn}
                        >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Stats
                        </TabsTrigger>
                        <TabsTrigger
                            value="moves"
                            style={activeTab === "moves" ? tabBtnActive : tabBtn}
                        >
                            <Zap className="h-3.5 w-3.5 mr-1" />
                            Moves
                        </TabsTrigger>
                    </TabsList>

                    {/* Info */}
                    <TabsContent value="info" className="p-0 m-0">
                        <ScrollArea className="h-[180px]">
                            <div className="p-3 space-y-3">
                                {hasBoosts && (
                                    <div
                                        className="pb-2"
                                        style={{
                                            borderBottom: "1px solid var(--border)",
                                        }}
                                    >
                                        <div
                                            className="text-t-xs font-semibold mb-1"
                                            style={{ color: "var(--text-dim)" }}
                                        >
                                            Stat Changes
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(pokemon.boosts).map(
                                                ([stat, value]) => (
                                                    <span
                                                        key={stat}
                                                        className="px-2 py-0.5 text-t-3xs rounded font-mono"
                                                        style={{
                                                            background:
                                                                value > 0
                                                                    ? "color-mix(in srgb, var(--emerald-400) 15%, var(--surface-2))"
                                                                    : value < 0
                                                                    ? "color-mix(in srgb, var(--red-500) 15%, var(--surface-2))"
                                                                    : "var(--surface-2)",
                                                            color:
                                                                value > 0
                                                                    ? "var(--emerald-400)"
                                                                    : value < 0
                                                                    ? "var(--red-500)"
                                                                    : "var(--text-dim)",
                                                        }}
                                                    >
                                                        {stat}:{" "}
                                                        {value > 0
                                                            ? `+${value}`
                                                            : value}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="pb-2"
                                    style={{
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <div
                                        className="text-t-xs font-semibold mb-1"
                                        style={{ color: "var(--text-dim)" }}
                                    >
                                        Abilities
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {pokemon.species.abilities[0] && (
                                            <span
                                                className="px-2 py-0.5 text-t-3xs rounded"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {pokemon.species.abilities[0]}
                                            </span>
                                        )}
                                        {pokemon.species.abilities[1] && (
                                            <span
                                                className="px-2 py-0.5 text-t-3xs rounded"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {pokemon.species.abilities[1]}
                                            </span>
                                        )}
                                        {pokemon.species.abilities.H && (
                                            <span
                                                className="px-2 py-0.5 text-t-3xs rounded"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {pokemon.species.abilities.H} (H)
                                            </span>
                                        )}
                                    </div>
                                    {pokemon.ability && (
                                        <div
                                            className="mt-1 text-t-xs"
                                            style={{
                                                color: "var(--accent-bright)",
                                            }}
                                        >
                                            Active: {pokemon.ability}
                                        </div>
                                    )}
                                </div>

                                {showDetailedInfo && pokemon.item && (
                                    <div className="pb-2">
                                        <div
                                            className="text-t-xs font-semibold mb-1"
                                            style={{ color: "var(--text-dim)" }}
                                        >
                                            Item
                                        </div>
                                        <span
                                            className="text-t-3xs px-2 py-1 rounded inline-block"
                                            style={{
                                                background: "var(--surface-2)",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {pokemon.item}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Stats */}
                    <TabsContent value="stats" className="p-0 m-0">
                        <div className="p-3">
                            <div className="space-y-1.5">
                                {stats.map((stat) => {
                                    const value = calculateStat(
                                        stat,
                                        pokemon.species.baseStats[stat],
                                        pokemon.level,
                                        31,
                                        stat === "hp" ? 0 : 0,
                                        1.0
                                    );
                                    const boost =
                                        stat !== "hp"
                                            ? pokemon.boosts?.[
                                                  stat as Exclude<StatID, "hp">
                                              ]
                                            : undefined;
                                    const base = pokemon.species.baseStats[stat];

                                    return (
                                        <div
                                            key={stat}
                                            className="flex items-center gap-2"
                                        >
                                            <span
                                                className="capitalize w-8 text-t-xs font-mono font-semibold"
                                                style={{
                                                    color: "var(--text-dim)",
                                                }}
                                            >
                                                {stat}
                                            </span>
                                            <div className="flex-1">
                                                <div
                                                    className="w-full h-[6px] rounded-full"
                                                    style={{
                                                        background:
                                                            "var(--surface-3)",
                                                    }}
                                                >
                                                    <div
                                                        className="h-[6px] rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, base / 1.7)}%`,
                                                            background: getStatColor(
                                                                base
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <span
                                                className="text-t-xs w-10 text-right font-mono tabular-nums"
                                                style={{
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {showDetailedInfo ? (
                                                    <>
                                                        {value}
                                                        {boost !== undefined &&
                                                            boost !== 0 && (
                                                                <span
                                                                    style={{
                                                                        color:
                                                                            boost > 0
                                                                                ? "var(--emerald-400)"
                                                                                : "var(--red-500)",
                                                                        marginLeft: 4,
                                                                    }}
                                                                >
                                                                    {boost > 0
                                                                        ? `+${boost}`
                                                                        : boost}
                                                                </span>
                                                            )}
                                                    </>
                                                ) : (
                                                    base
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div
                                className="mt-3 text-t-3xs"
                                style={{ color: "var(--text-dim)" }}
                            >
                                {showDetailedInfo
                                    ? "Values adjusted for level and boosts"
                                    : "Only base stats are shown"}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Moves */}
                    <TabsContent value="moves" className="p-0 m-0">
                        <ScrollArea className="h-[180px]">
                            <div className="p-3">
                                <div
                                    className="text-t-xs font-semibold mb-2"
                                    style={{ color: "var(--text-dim)" }}
                                >
                                    {showDetailedInfo
                                        ? "Known moves:"
                                        : "Revealed moves:"}
                                </div>

                                {pokemon.movesUsedWhileActive.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1">
                                        {pokemon.movesUsedWhileActive.map(
                                            (move) => (
                                                <div
                                                    key={move}
                                                    className="px-2 py-1 text-t-xs rounded"
                                                    style={{
                                                        background:
                                                            "var(--surface-2)",
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    {move}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="text-t-xs italic"
                                        style={{ color: "var(--text-dim)" }}
                                    >
                                        {showDetailedInfo
                                            ? "No moves data available"
                                            : "No revealed moves yet"}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </HoverCardContent>
        </HoverCard>
    );
}

function calculateSpeed(base: number, level: number, natureModifier: number, IV: number, EV: number) {
    return Math.floor(
        Math.floor(
            (2 * base + IV + Math.floor(EV / 4)) * level / 100 + 5
        ) * natureModifier
    );
}

function calculateStat(stat: StatID, base: number, level: number, IV: number, EV: number, natureModifier: number) {
    if (stat === 'hp') {
        return Math.floor((2 * base + IV + Math.floor(EV / 4)) * level / 100) + level + 10;
    } else {
        return Math.floor(
            Math.floor(
                (2 * base + IV + Math.floor(EV / 4)) * level / 100 + 5
            ) * natureModifier
        );
    }
}

function getStatColor(value: number): string {
    if (value >= 120) return "var(--cyan-500)";
    if (value >= 100) return "var(--emerald-400)";
    if (value >= 80) return "var(--lime-500, #84cc16)";
    if (value >= 60) return "var(--amber-400)";
    if (value >= 40) return "var(--orange-500, #f97316)";
    return "var(--red-500)";
}

function getStatusColor(status: string) {
    switch (status) {
        case 'brn': return { bg: 'color-mix(in srgb, var(--orange-500, #f97316) 25%, var(--surface-2))', text: 'var(--orange-500, #f97316)' };
        case 'frz': return { bg: 'color-mix(in srgb, var(--cyan-400, #22d3ee) 25%, var(--surface-2))', text: 'var(--cyan-400, #22d3ee)' };
        case 'par': return { bg: 'color-mix(in srgb, var(--amber-400) 25%, var(--surface-2))', text: 'var(--amber-400)' };
        case 'psn': return { bg: 'color-mix(in srgb, var(--purple-500, #a855f7) 25%, var(--surface-2))', text: 'var(--purple-500, #a855f7)' };
        case 'tox': return { bg: 'color-mix(in srgb, var(--purple-700, #7e22ce) 25%, var(--surface-2))', text: 'var(--purple-500, #a855f7)' };
        case 'slp': return { bg: 'var(--surface-3)', text: 'var(--text-dim)' };
        default: return { bg: 'var(--surface-2)', text: 'var(--text-dim)' };
    }
}

function getStatusName(status: string) {
    switch (status) {
        case 'brn': return 'Burned';
        case 'frz': return 'Frozen';
        case 'par': return 'Paralyzed';
        case 'psn': return 'Poisoned';
        case 'tox': return 'Badly Poisoned';
        case 'slp': return 'Asleep';
        default: return status.toUpperCase();
    }
}