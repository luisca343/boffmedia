"use client";

import { useState, useEffect } from "react";
import { Users, Trophy, Repeat2 } from "lucide-react";
import { PageHeader } from "@/components/boffmedia-old/tools/PageHeader";
import { BoffContainer } from "@/components/boffmedia-old/tools/BoffContainer";
import { BOFF_VARIANTS } from "@/components/boffmedia-old/tools/utils/boffVariants";
import { ParticipantsList } from "./_components/participants/ParticipantsList";
import { GiveawayControls } from "./_components/GiveawayControls";
import SpinnerAnimation from "./_components/spinner/SpinnerAnimation";
import { WinnerDisplay } from "./_components/WinnerDisplay";

const STATS = [
  { key: "participants", label: "Participantes", boffKey: "primary" as const, icon: Users },
  { key: "winners",      label: "Ganadores",     boffKey: "yellow"  as const, icon: Trophy },
  { key: "rounds",       label: "Rondas",        boffKey: "secondary" as const, icon: Repeat2 },
];

export default function Sorteo() {
  const [participants,    setParticipants]    = useState<string[]>([]);
  const [isSpinning,      setIsSpinning]      = useState(false);
  const [winner,          setWinner]          = useState<string | null>(null);
  const [showWinner,      setShowWinner]      = useState(false);
  const [previousWinners, setPreviousWinners] = useState<string[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleAddParticipant = (name: string) => {
    if (name.trim() && !participants.includes(name.trim())) {
      setParticipants(prev => [...prev, name.trim()]);
    }
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(prev => prev.filter(p => p !== name));
  };

  const handleUploadList = (list: string[]) => {
    const unique = Array.from(new Set(list.map(n => n.trim()).filter(Boolean)));
    setParticipants(unique);
  };

  const handleStartGiveaway = () => {
    if (participants.length === 0) return;
    setIsSpinning(true);
    setShowWinner(false);
    setWinner(null);
    setAnimationComplete(false);
    setTimeout(() => {
      setWinner(participants[Math.floor(Math.random() * participants.length)]);
    }, 500);
  };

  useEffect(() => {
    if (animationComplete && winner) {
      setIsSpinning(false);
      setShowWinner(true);
      setPreviousWinners(prev => [...prev, winner]);
    }
  }, [animationComplete, winner]);

  const handleReset = () => setShowWinner(false);

  const statValues = {
    participants: participants.length,
    winners:      previousWinners.length,
    rounds:       previousWinners.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={{ prefix: "Boffmedia", highlight: "Sorteos" }}
        subtitle="Selecciona un ganador al azar entre tus participantes de forma justa y divertida."
        theme="primary"
        sectionLabel="Otros"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-[36rem]">
          <ParticipantsList
            participants={participants}
            onRemove={handleRemoveParticipant}
            previousWinners={previousWinners}
          />
        </div>

        <div className="lg:col-span-2 h-[36rem]">
          {isSpinning || showWinner ? (
            <BoffContainer variant="primary" className="h-full" contentClassName="p-6">
              {isSpinning && (
                <SpinnerAnimation
                  participants={participants}
                  winner={winner}
                  onComplete={() => setAnimationComplete(true)}
                />
              )}
              {showWinner && winner && (
                <WinnerDisplay
                  winner={winner}
                  onReset={handleReset}
                  roundNumber={previousWinners.length}
                />
              )}
            </BoffContainer>
          ) : (
            <GiveawayControls
              onAddParticipant={handleAddParticipant}
              onUploadList={handleUploadList}
              onStartGiveaway={handleStartGiveaway}
              participantCount={participants.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}
