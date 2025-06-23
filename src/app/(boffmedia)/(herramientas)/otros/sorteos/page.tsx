"use client"

import { useState, useEffect } from "react"
import BoffLayout from "@/app/(boffmedia)/_components/layout/BoffLayout"
import GiveawayHeader from "./_components/GiveawayHeader"
import ParticipantsList from "./_components/ParticipantsList"
import GiveawayControls from "./_components/GiveawayControls"
import SpinnerAnimation from "./_components/SpinnerAnimation"
import WinnerDisplay from "./_components/WinnerDisplay"

export default function Sorteo() {
  const [participants, setParticipants] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [previousWinners, setPreviousWinners] = useState<string[]>([])
  const [animationComplete, setAnimationComplete] = useState(false)

  const handleAddParticipant = (name: string) => {
    if (name.trim() && !participants.includes(name.trim())) {
      setParticipants([...participants, name.trim()])
    }
  }

  const handleRemoveParticipant = (name: string) => {
    setParticipants(participants.filter(participant => participant !== name))
  }

  const handleUploadList = (list: string[]) => {
    const uniqueList = Array.from(new Set(list.map(name => name.trim()).filter(Boolean)))
    setParticipants(uniqueList)
  }

  const handleStartGiveaway = () => {
    if (participants.length > 0) {
      setIsSpinning(true)
      setShowWinner(false)
      setWinner(null)
      setAnimationComplete(false)
      
      // After a short delay, select a winner
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * participants.length)
        const selectedWinner = participants[randomIndex]
        setWinner(selectedWinner)
      }, 500)
    }
  }

  // Listen for animation completion from the spinner component
  useEffect(() => {
    if (animationComplete && winner) {
      setIsSpinning(false)
      setShowWinner(true)
      setPreviousWinners(prev => [...prev, winner])
    }
  }, [animationComplete, winner])

  const handleReset = () => {
    setShowWinner(false)
    // Optionally remove the winner from the list
    // setParticipants(participants.filter(p => p !== winner))
  }

  const handleAnimationComplete = () => {
    setAnimationComplete(true)
  }

  return (
    <>
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
        
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
              <div className="bg-surface-800/70 backdrop-blur-sm border border-surface-700 rounded-xl p-6 shadow-lg">
                {isSpinning && 
                  <SpinnerAnimation 
                    participants={participants} 
                    winner={winner} 
                    onComplete={handleAnimationComplete}
                  />
                }
                {showWinner && winner && <WinnerDisplay winner={winner} onReset={handleReset} />}
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
      </div>
    </>
  )
}