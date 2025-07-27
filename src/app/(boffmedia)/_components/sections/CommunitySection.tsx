import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, Award } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { FloatingSection } from "../layout/FloatingSection"

export async function CommunitySection() {
  const t = await getTranslations("boffmedia.communitySection");

  const features = [
    {
      title: t("features.events.title"),
      description: t("features.events.description"),
      icon: Calendar,
      color: "from-primary-500 to-orange-500",
      hoverColor: "hover:border-primary-500/50",
      shadowColor: "hover:shadow-primary-500/20"
    },
    {
      title: t("features.ranking.title"),
      description: t("features.ranking.description"),
      icon: Trophy,
      color: "from-orange-500 to-amber-500",
      hoverColor: "hover:border-orange-500/50",
      shadowColor: "hover:shadow-orange-500/20"
    },
    {
      title: t("features.achievements.title"),
      description: t("features.achievements.description"),
      icon: Award,
      color: "from-amber-500 to-yellow-500",
      hoverColor: "hover:border-amber-500/50",
      shadowColor: "hover:shadow-amber-500/20"
    },
  ]

  return (
    <section className="relative mt-8 py-32 bg-gradient-to-br from-surface-800 via-surface-800 to-surface-900 overflow-hidden  wave-community-top">
      <div className="relative container mx-auto px-4 z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent flex-1"></div>
            <Users className="h-8 w-8 text-primary-500" />
            <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent flex-1"></div>
          </div>
          <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-orange-400 to-amber-400">
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
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-500`}></div>
              
              <CardHeader className="relative z-10 text-center">
                <div className="relative mx-auto mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                  <div className={`relative p-4 rounded-full bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl text-surface-50 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-orange-400 transition-all duration-300">
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
    </section>
  )
}