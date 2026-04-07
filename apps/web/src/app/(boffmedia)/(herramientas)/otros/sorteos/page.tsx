"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/boffmedia/tools/PageHeader";
import { BoffContainer } from "@/components/boffmedia/tools/BoffContainer";
import { ParticipantsList } from "./_components/participants/ParticipantsList";
import { GiveawayControls } from "./_components/GiveawayControls";
import SpinnerAnimation from "./_components/spinner/SpinnerAnimation";
import { WinnerDisplay } from "./_components/WinnerDisplay";

export default function Sorteo() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [previousWinners, setPreviousWinners] = useState<string[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleAddParticipant = (name: string) => {
    if (name.trim() && !participants.includes(name.trim())) {
      setParticipants([...participants, name.trim()]);
    }
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(participants.filter(p => p !== name));
  };

  const handleUploadList = (list: string[]) => {
    const uniqueList = Array.from(new Set(list.map(n => n.trim()).filter(Boolean)));
    setParticipants(uniqueList);
  };

  const handleStartGiveaway = () => {
    if (participants.length > 0) {
      setIsSpinning(true);
      setShowWinner(false);
      setWinner(null);
      setAnimationComplete(false);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * participants.length);
        setWinner(participants[randomIndex]);
      }, 500);
    }
  };

  useEffect(() => {
    if (animationComplete && winner) {
      setIsSpinning(false);
      setShowWinner(true);
      setPreviousWinners(prev => [...prev, winner]);
    }
  }, [animationComplete, winner]);

  const handleReset = () => {
    setShowWinner(false);
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
        <div className="lg:col-span-1">
          <ParticipantsList
            participants={participants}
            onRemove={handleRemoveParticipant}
            previousWinners={previousWinners}
          />
        </div>

        <div className="lg:col-span-2">
          {isSpinning || showWinner ? (
            <BoffContainer variant="primary" contentClassName="p-6">
              {isSpinning && (
                <SpinnerAnimation
                  participants={participants}
                  winner={winner}
                  onComplete={() => setAnimationComplete(true)}
                />
              )}
              {showWinner && winner && (
                <WinnerDisplay winner={winner} onReset={handleReset} />
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
