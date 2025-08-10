"use client"
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageCircle, Heart, Gamepad2, Code, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CommunitySection() {
  const t = useTranslations("boffmedia");

  const communityElements = [
    { icon: Users, name: "Jugadores", color: "from-cyan-500 to-blue-600" },
    { icon: MessageCircle, name: "Discusiones", color: "from-blue-500 to-indigo-600" },
    { icon: Heart, name: "Colaboración", color: "from-indigo-500 to-purple-600" },
    { icon: Gamepad2, name: "Gaming", color: "from-purple-500 to-pink-600" },
    { icon: Code, name: "Desarrollo", color: "from-pink-500 to-rose-600" },
    { icon: Zap, name: "Innovación", color: "from-rose-500 to-orange-600" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-800 via-surface-700 to-primary-500/50">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)`
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Section: Community Info */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              <span className="text-surface-50">{t("community.title.first")}</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {t("community.title.second")}
              </span>
            </h2>
            <p className="text-xl text-surface-200 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("community.description")}
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 mb-12">
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-surface-300 text-lg">{t("community.highlights.connect")}</span>
              </div>
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span className="text-surface-300 text-lg">{t("community.highlights.collaborate")}</span>
              </div>
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className="text-surface-300 text-lg">{t("community.highlights.resources")}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-xl group px-8 py-4"
                asChild
              >
                <Link href="/community">
                  {t("community.buttons.joinNow")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-8 py-4"
                asChild
              >
                <Link href="/discord">{t("community.buttons.discord")}</Link>
              </Button>
            </div>
          </div>

          {/* Right Section: Community Visualization */}
          <div className="relative order-1 lg:order-2">
            <div className="relative h-[500px] flex items-center justify-center">
              
              {/* Central Community Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl z-20">
                <Users className="w-20 h-20 text-white animate-pulse" />
              </div>

              {/* Animated rings */}
              <div className="absolute top-1/2 left-1/2 w-72 h-72 border border-cyan-500/20 rounded-full animate-spin pointer-events-none" style={{animationDuration: '30s', transform: 'translate(-50%, -50%)'}}></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 border border-blue-500/10 rounded-full animate-spin pointer-events-none" style={{animationDuration: '40s', animationDirection: 'reverse', transform: 'translate(-50%, -50%)'}}></div>
              <div className="absolute top-1/2 left-1/2 w-[28rem] h-[28rem] border border-indigo-500/5 rounded-full animate-spin pointer-events-none" style={{animationDuration: '50s', transform: 'translate(-50%, -50%)'}}></div>

              {/* Orbiting community elements */}
              {communityElements.map((element, index) => {
                const angle = (index * 60) * (Math.PI / 180);
                const radius = 180;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    key={element.name}
                    className="absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 animate-float hover:scale-125 transition-all duration-300 cursor-pointer group z-30"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      animationDelay: `${index * 0.5}s`,
                      animationDuration: '4s'
                    }}
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${element.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-12`}>
                      <element.icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Connecting line */}
                    <div 
                      className="absolute w-0.5 bg-gradient-to-r from-cyan-400/20 to-transparent origin-left opacity-40 group-hover:opacity-80 transition-opacity duration-300"
                      style={{
                        height: `${radius}px`,
                        transform: `rotate(${angle + Math.PI}rad)`,
                        left: '50%',
                        top: '50%',
                      }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-30">
                      <span className="text-sm text-cyan-400 font-medium bg-surface-900/90 px-3 py-2 rounded-lg shadow-lg border border-cyan-500/20">
                        {element.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Floating particles */}
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-ping"
                  style={{
                    top: `${10 + (i * 6)}%`,
                    left: `${5 + (i * 6)}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: '5s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}