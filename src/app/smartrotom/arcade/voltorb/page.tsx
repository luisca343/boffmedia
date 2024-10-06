import RainbowText from "../_components/RainbowText"
import StarsBackground from "../_components/StarsBackground"
import VoltorbFlipGame from "./_components/VoltorbFlipGame"

export default function VoltorbFlip() {
  return (
    <div className="min-h-full w-full bg-purple-900 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      <StarsBackground />
      <RainbowText text="Voltorb Flip" />
      <VoltorbFlipGame />
    </div>
  )
}