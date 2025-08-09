import Image from "next/image";
import { ReactNode } from "react";


interface GameSpotlightCardProps {
  iconSrc: string;
  iconAlt: string;
  title: string;
  titleGradientClass: string;
  iconBgClass?: string; // e.g. 'from-emerald-600 to-green-700' or 'from-orange-500 to-amber-500'
  underlineClass?: string; // e.g. 'from-emerald-500 to-green-400' or 'from-orange-400 to-amber-400'
  children: ReactNode;
}

export function GameSpotlightCard({
  iconSrc,
  iconAlt,
  title,
  titleGradientClass,
  iconBgClass = 'from-emerald-600 to-green-700',
  underlineClass = 'from-emerald-500 to-green-400',
  children,
}: GameSpotlightCardProps) {
  return (
    <div className="w-full max-w-3xl space-y-8 mx-auto px-2 sm:px-4 md:px-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className={`absolute inset-0 ${iconBgClass.includes('orange') ? 'bg-orange-500/30' : 'bg-emerald-500/30'} rounded-2xl blur-xl`}></div>
          <div className={`relative bg-gradient-to-br ${iconBgClass} p-4 rounded-xl`}>
            <Image
              src={iconSrc}
              alt={iconAlt}
              width={60}
              height={60}
              className="rounded-lg"
            />
          </div>
        </div>
        <div>
          <h3 className={`text-4xl font-bold text-transparent bg-clip-text ${titleGradientClass}`}>
            {title}
          </h3>
          <div className={`h-1 w-20 bg-gradient-to-r ${underlineClass} rounded-full mt-2`}></div>
        </div>
      </div>
      {children}
    </div>
  );
}
