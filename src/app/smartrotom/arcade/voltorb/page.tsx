import { RainbowText } from "../_components/RainbowText"
import StarsBackground from "../_components/StarsBackground"
import VoltorbFlipGame from "./_components/VoltorbFlipGame"
import VoltorbImage from "./_components/VoltorbIcon"

export default function VoltorbFlip() {
  return (
    <div className="flex flex-col h-full w-full bg-purple-900 p-4 font-mono">
      <StarsBackground />
      <div className="flex items-center justify-center mb-4">
        <RainbowText size="xl" text="Gira Voltorb" />
      </div>
      <VoltorbFlipGame />
    </div>
  )
}