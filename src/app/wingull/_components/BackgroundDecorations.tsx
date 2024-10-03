import Image from "next/image";

interface BackgroundDecorationsProps {
  includeGradient?: boolean;
}

export function BackgroundDecorations({ includeGradient = true }: BackgroundDecorationsProps) {
  return (
    <div className={`-z-10 absolute inset-0 overflow-hidden pointer-events-none ${includeGradient ? 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600' : ''}`}>
      <div className="absolute inset-0 overflow-hidden opacity-20">
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
  );
}