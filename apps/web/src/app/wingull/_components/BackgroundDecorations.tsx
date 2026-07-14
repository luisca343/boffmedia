import Image from "next/image"

interface BackgroundDecorationsProps {
  includeGradient?: boolean,
  withOverlay?: boolean
}

export function BackgroundDecorations({ includeGradient = true, withOverlay = false }: BackgroundDecorationsProps) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
      {includeGradient && <div className="absolute inset-0 bg-gradient-to-b from-secondary-hover via-secondary-hover to-secondary" />}
      {!includeGradient && <div className="absolute inset-0 bg-[url(/assets/img/w-bg.png)] bg-cover bg-center " />}
      {!withOverlay && <div className="absolute inset-0 bg-base opacity-50" />}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <Image
          src="/assets/img/Wingull_silhouette.png"
          alt="Wingull silhouette"
          width={200}
          height={200}
          className="absolute top-10 left-10 transform -rotate-12 animate-float-wingull"
        />
        <Image
          src="/assets/img/Refined_Pokeball_silhouette.png"
          alt="Pokeball silhouette"
          width={150}
          height={150}
          className="absolute bottom-20 right-20 animate-bounce-spin"
        />
      </div>
    </div>
  )
}

