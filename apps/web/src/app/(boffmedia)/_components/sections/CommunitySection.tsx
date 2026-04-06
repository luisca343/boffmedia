"use client"
import { Button, Container, Grid, Stack, Heading, Text } from "@/components/ui";
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

      <Container size="lg" className="relative py-24 sm:py-32">
        <Grid cols={1} colsLg={2} gap={12} className="items-center">

          {/* Left Section: Community Info */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <Heading as="h2" size="xl" weight="black" className="mb-6">
              <span className="text-surface-50">{t("community.title.first")}</span>
              <span
                className="block bg-gradient-to-r from-secondary-300 via-secondary-400 to-secondary-500 bg-clip-text text-transparent"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {t("community.title.second")}
              </span>
            </Heading>
            <Text size="xl" color="muted" leading="relaxed" className="mb-12 max-w-xl mx-auto lg:mx-0">
              {t("community.description")}
            </Text>

            {/* Feature highlights */}
            <Stack direction="vertical" gap={3} className="mb-12">
              {[
                { delay: "0s", text: t("community.highlights.connect") },
                { delay: "0.5s", text: t("community.highlights.collaborate") },
                { delay: "1s", text: t("community.highlights.resources") },
              ].map(({ delay, text }, i) => (
                <Stack key={i} direction="horizontal" gap={3} align="center" justify="center" className="lg:justify-start">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse bg-accent-500/85"
                    style={{ animationDelay: delay }}
                  />
                  <Text as="span" color="muted">{text}</Text>
                </Stack>
              ))}
            </Stack>

            <Stack direction="horizontal" gap={4} wrap className="justify-center lg:justify-start">
              <Button size="lg" variant="secondary" className="group" asChild>
                <Link href="/community">
                  {t("community.buttons.joinNow")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="secondaryOutline" asChild>
                <Link href="https://discord.gg/TWqjNHQz7d" target="_blank" rel="noopener noreferrer">
                  {t("community.buttons.discord")}
                </Link>
              </Button>
            </Stack>
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
        </Grid>
      </Container>

    </section>
  );
}