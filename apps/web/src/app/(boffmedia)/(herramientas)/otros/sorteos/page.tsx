"use client";

import { useState, useEffect } from "react";
import { Container, Grid, Stack } from "@/components/ui";
import { GiveawayHeader } from "./_components/GiveawayHeader";
import { ParticipantsList } from "./_components/ParticipantsList";
import { GiveawayControls } from "./_components/GiveawayControls";
import SpinnerAnimation from "./_components/SpinnerAnimation";
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
    setParticipants(participants.filter(participant => participant !== name));
  };

  const handleUploadList = (list: string[]) => {
    const uniqueList = Array.from(new Set(list.map(name => name.trim()).filter(Boolean)));
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

  const handleReset = () => setShowWinner(false);
  const handleAnimationComplete = () => setAnimationComplete(true);

  return (
    <Container size="lg">
      <Stack gap={8}>
        <GiveawayHeader />

        <Grid cols={1} colsLg={3} gap={6}>
          <div className="lg:col-span-1">
            <ParticipantsList
              participants={participants}
              onRemove={handleRemoveParticipant}
              previousWinners={previousWinners}
            />
          </div>

          <div className="lg:col-span-2">
            {isSpinning || showWinner ? (
              <div className="bg-gradient-to-br from-surface-800/90 to-surface-900/90 backdrop-blur-sm border border-surface-700/50 rounded-2xl p-6 shadow-2xl">
                {isSpinning && (
                  <SpinnerAnimation
                    participants={participants}
                    winner={winner}
                    onComplete={handleAnimationComplete}
                  />
                )}
                {showWinner && winner && (
                  <WinnerDisplay winner={winner} onReset={handleReset} />
                )}
              </div>
            ) : (
              <GiveawayControls
                onAddParticipant={handleAddParticipant}
                onUploadList={handleUploadList}
                onStartGiveaway={handleStartGiveaway}
                participantCount={participants.length}
              />
            )}
          </div>
        </Grid>
      </Stack>
    </Container>
  );
}
