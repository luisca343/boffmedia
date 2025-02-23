import Image from "next/image"

interface BackgroundDecorationsProps {
  includeGradient?: boolean
}

export function BackgroundDecorations({ includeGradient = true }: BackgroundDecorationsProps) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
      {includeGradient && <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-500" />}
      {!includeGradient && <div className="absolute inset-0 bg-[url(/img/w-bg.png)] bg-cover bg-center " />}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <Image
          src="/img/Wingull_silhouette.png"
          alt="Wingull silhouette"
          width={200}
          height={200}
          className="absolute top-10 left-10 transform -rotate-12 animate-float-wingull"
        />
        <Image
          src="/img/Refined_Pokeball_silhouette.png"
          alt="Pokeball silhouette"
          width={150}
          height={150}
          className="absolute bottom-20 right-20 animate-bounce-spin"
        />
      </div>
    </div>
  )
}

