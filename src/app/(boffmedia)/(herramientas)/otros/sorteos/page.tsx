"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { SectionHeader } from "@/components/boffmedia/sections/SectionHeader";
import { Gift } from "lucide-react";
import { ParticipantsList } from "./_components/ParticipantsList";
import { GiveawayControls } from "./_components/GiveawayControls";
import SpinnerAnimation from "./_components/SpinnerAnimation";
import { WinnerDisplay } from "./_components/WinnerDisplay";

export default function Sorteo() {
  const t = useTranslations('boffmedia');
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
      
      // After a short delay, select a winner
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * participants.length);
        const selectedWinner = participants[randomIndex];
        setWinner(selectedWinner);
      }, 500);
    }
  };

  // Listen for animation completion from the spinner component
  useEffect(() => {
    if (animationComplete && winner) {
      setIsSpinning(false);
      setShowWinner(true);
      setPreviousWinners(prev => [...prev, winner]);
    }
  }, [animationComplete, winner]);

  const handleReset = () => {
    setShowWinner(false);
    // Optionally remove the winner from the list
    // setParticipants(participants.filter(p => p !== winner))
  };

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="min-h-full text-surface-50 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div variants={itemVariants}>
          <SectionHeader
            title={t('giveaway.title')}
            variant="orange"
            leftIcon={<Gift className="w-8 h-8 text-orange-400" />}
            rightIcon={<Gift className="w-8 h-8 text-yellow-400" />}
            leftIconBg={" "}
            rightIconBg={" "}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
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
                <div className="bg-gradient-to-br from-surface-800/90 to-surface-900/90 backdrop-blur-sm border border-surface-700/50 rounded-2xl p-6 shadow-2xl">
                  {isSpinning && 
                    <SpinnerAnimation 
                      participants={participants} 
                      winner={winner} 
                      onComplete={handleAnimationComplete}
                    />
                  }
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
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}