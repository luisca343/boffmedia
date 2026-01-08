"use client"
import { Button } from "@/components/ui/primitives/button";
import { ArrowRight, Users, MessageCircle, Heart, Gamepad2, Code, Zap } from "lucide-react";
import { OrbitingElementsCloud } from "@/components/ui/display/OrbitingElementsCloud";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CommunitySection() {
  const t = useTranslations("boffmedia");

  const communityElements = [
    { icon: <Users className="w-10 h-10 text-white" />, name: "Jugadores", color: "from-cyan-500 to-blue-600" },
    { icon: <MessageCircle className="w-10 h-10 text-white" />, name: "Discusiones", color: "from-blue-500 to-indigo-600" },
    { icon: <Heart className="w-10 h-10 text-white" />, name: "Colaboración", color: "from-indigo-500 to-purple-600" },
    { icon: <Gamepad2 className="w-10 h-10 text-white" />, name: "Gaming", color: "from-purple-500 to-pink-600" },
    { icon: <Code className="w-10 h-10 text-white" />, name: "Desarrollo", color: "from-pink-500 to-rose-600" },
    { icon: <Zap className="w-10 h-10 text-white" />, name: "Innovación", color: "from-rose-500 to-orange-600" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary-900 via-secondary-500/30 to-secondary-700/40">

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
                variant="secondaryOutline"
                asChild
              >
                <Link href="https://discord.gg/TWqjNHQz7d" target="_blank" rel="noopener noreferrer">{t("community.buttons.discord")}</Link>
              </Button>
            </div>
          </div>

          {/* Right Section: Community Visualization */}
          <div className="relative order-1 lg:order-2">
            <OrbitingElementsCloud
              centralIcon={<Users className="w-20 h-20 text-white animate-pulse" />}
              centralBg="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500"
              orbitingElements={communityElements}
              ringConfigs={[
                { size: "w-72 h-72", border: "border border-cyan-500/20", duration: "30s" },
                { size: "w-96 h-96", border: "border border-blue-500/10", duration: "40s", direction: "reverse" },
                { size: "w-[28rem] h-[28rem]", border: "border border-indigo-500/5", duration: "50s" },
              ]}
              particleCount={15}
              particleColorClass="bg-cyan-400/40"
              particleSize="w-1.5 h-1.5"
              particleDuration="5s"
              particleDelayStep={0.4}
              radius={180}
            />
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