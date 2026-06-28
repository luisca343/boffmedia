import { ReactNode } from "react";
import { themes } from "../themes";

type Platform = keyof typeof themes;

interface BaseProfileHeaderProps {
  title: string;
  username?: string;
  avatarUrl: string;
  bannerUrl?: string;
  description: string;
  platform: Platform;
  statsComponent: ReactNode;
  additionalInfo?: ReactNode;
}

export const BaseProfileHeader = ({
  title,
  username,
  avatarUrl,
  bannerUrl,
  description,
  platform,
  statsComponent,
  additionalInfo
}: BaseProfileHeaderProps) => {
  const theme = themes[platform];
  
  // Get banner image or fallback to platform gradient
  const bannerStyle = bannerUrl 
    ? { backgroundImage: `url(${bannerUrl})` } 
    : { background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 100%)` };

  return (
    <>
      <div className="w-full h-40 md:h-56 bg-cover bg-center" style={bannerStyle}></div>
      
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-layer-2 rounded-xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-edge-strong mb-4 md:mb-0 md:mr-6 bg-layer-3 flex-shrink-0">
              <img
                src={avatarUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold mb-2">
                {title}
              </h1>
              
              {username && (
                <p className="text-sm text-ink mb-2">
                  @{username}
                </p>
              )}
              
              {statsComponent}
              
              {additionalInfo}
              
              <p className="text-ink line-clamp-2 md:max-w-2xl mt-4">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
