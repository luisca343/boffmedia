import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Gamepad, Trophy } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

export async function CommunitySection() {
  const t = await getTranslations("boffmedia.communitySection");

  const features = [
    {
      title: t("features.teams.title"),
      description: t("features.teams.description"),
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      hoverColor: "hover:border-blue-500/50",
      shadowColor: "hover:shadow-blue-500/20"
    },
    {
      title: t("features.events.title"),
      description: t("features.events.description"),
      icon: Gamepad,
      color: "from-green-500 to-emerald-500",
      hoverColor: "hover:border-green-500/50",
      shadowColor: "hover:shadow-green-500/20"
    },
    {
      title: t("features.ranks.title"),
      description: t("features.ranks.description"),
      icon: Trophy,
      color: "from-yellow-500 to-orange-500",
      hoverColor: "hover:border-yellow-500/50",
      shadowColor: "hover:shadow-yellow-500/20"
    },
  ]

  return (
    <section className="relative py-24 bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden">
      {/* Top SVG Divider */}
      <div className="absolute top-0 left-0 w-full overflow-hidden">
        <svg className="relative block w-full h-16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V7.23C0,65.52,268.63,112.77,600,112.77S1200,65.52,1200,7.23V0Z" className="fill-surface-800"></path>
        </svg>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative container mx-auto px-4 z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent flex-1"></div>
            <Users className="h-8 w-8 text-primary-500" />
            <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent flex-1"></div>
          </div>
          <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-blue-400 to-green-400">
            {t("title")}
          </h2>
          <p className="text-xl text-surface-300 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className={`group relative bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700 ${feature.hoverColor} transition-all duration-500 hover:scale-105 hover:shadow-2xl ${feature.shadowColor}`}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-500`}></div>
              
              <CardHeader className="relative z-10 text-center">
                <div className="relative mx-auto mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                  <div className={`relative p-4 rounded-full bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl text-surface-50 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-blue-400 transition-all duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-surface-300 group-hover:text-surface-200 transition-colors duration-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-orange-500 rounded-lg blur-xl opacity-30"></div>
            <Button 
              size="lg" 
              className="relative text-lg bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-4" 
              asChild
            >
              <Link href="/community" className="flex items-center gap-2">
                {t("joinNowButton")}
                <Users className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-primary-500 rounded-full opacity-20 animate-pulse" style={{top: '20%', left: '10%', animationDelay: '0s'}}></div>
        <div className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-30 animate-pulse" style={{top: '60%', left: '80%', animationDelay: '1s'}}></div>
        <div className="absolute w-3 h-3 bg-green-500 rounded-full opacity-15 animate-pulse" style={{top: '80%', left: '20%', animationDelay: '2s'}}></div>
        <div className="absolute w-2 h-2 bg-yellow-500 rounded-full opacity-25 animate-pulse" style={{top: '40%', left: '90%', animationDelay: '1.5s'}}></div>
      </div>
    </section>
  )
}