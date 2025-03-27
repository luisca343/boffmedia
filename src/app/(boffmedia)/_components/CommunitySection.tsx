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
    },
    {
      title: t("features.events.title"),
      description: t("features.events.description"),
      icon: Gamepad,
    },
    {
      title: t("features.ranks.title"),
      description: t("features.ranks.description"),
      icon: Trophy,
    },
  ]

  return (
    <section className="py-24 bg-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">{t("title")}</h2>
          <p className="text-xl text-surface-300 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-surface-800 hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-primary-500 mb-4" />
                <CardTitle className="text-xl text-surface-50">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-surface-300">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button size="lg" className="text-lg bg-primary-500 hover:bg-primary-600 text-white" asChild>
            <Link href="/community">{t("joinNowButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}