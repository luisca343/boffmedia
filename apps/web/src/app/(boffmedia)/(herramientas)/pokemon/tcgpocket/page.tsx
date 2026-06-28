"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Search, Users, CreditCard, SwordIcon, Sparkles, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TCGPocket() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations("tcgpocket");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleViewGallery = () => {
    if (username.trim()) {
      router.push(`/pokemon/tcgpocket/galeria/${username}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username.trim()) {
      handleViewGallery();
    }
  };

  const menuItems = [
    {
      title: t("viewGallery.title"),
      description: t("viewGallery.description"),
      icon: Users,
      href: "/pokemon/tcgpocket/galeria",
      iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
      textColor: "text-amber-400",
      hoverColor: "hover:text-amber-300",
      bg: "bg-gradient-to-br from-amber-900/20 to-yellow-900/30"
    },
    {
      title: t("cardsList.title"),
      description: t("cardsList.description"),
      icon: CreditCard,
      href: "/pokemon/tcgpocket/cartas",
      iconBg: "bg-gradient-to-br from-secondary-hover to-cyan-500",
      textColor: "text-secondary-hover",
      hoverColor: "hover:text-secondary-hover",
      bg: "bg-gradient-to-br from-secondary-soft/20 to-cyan-900/30"
    },
    {
      title: t("battles.title"),
      description: t("battles.description"),
      icon: SwordIcon,
      href: "/pokemon/tcgpocket/combates",
      iconBg: "bg-gradient-to-br from-red-400 to-rose-500",
      textColor: "text-red-400",
      hoverColor: "hover:text-red-300",
      bg: "bg-gradient-to-br from-red-900/20 to-rose-900/30"
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header with Hero image */}
      <div className="relative rounded-xl overflow-hidden mb-6 h-48 sm:h-64">
        {isMounted && (
          <>
            <Image
              src="/img/games/tcgpocket/hero.webp"
              alt={t("heroAlt")}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-layer-1/90 to-layer-1/50"></div>
            <div className="absolute inset-0 flex items-center p-6">
              <div>
                <div className="mb-2">
                  <Image
                    src="/img/games/tcgpocket/icon.webp"
                    alt={t("logoAlt")}
                    width={150}
                    height={100}
                    className="object-contain"
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-ink drop-shadow-lg">
                  {t("heading.title")} <span className="text-yellow-400">{t("heading.highlight")}</span>
                </h1>
                <p className="text-ink mt-2 text-sm sm:text-base">
                  {t("heading.subtitle")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick search card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-layer-2 border-edge shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" /> 
              {t("quickSearch.title")}
            </CardTitle>
            <CardDescription>
              {t("quickSearch.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder={t("quickSearch.placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-layer-3 border-edge text-ink focus-visible:ring-primary"
              />
              <Button 
                onClick={handleViewGallery} 
                disabled={!username.trim()}
              >
                <Search className="mr-2 h-4 w-4" /> {t("quickSearch.searchButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid gap-6 md:grid-cols-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={`border-edge hover:border-edge transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden hover:scale-105 hover:shadow-xl ${item.bg}`}
                  onClick={() => router.push(item.href)}
                >
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center mb-3 shadow-lg`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-edge/30">
                    <Button 
                      variant="ghost" 
                      className={`ml-auto p-0 ${item.textColor} ${item.hoverColor} transition-colors`}>
                      {t("common.access")} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
    </div>
  );
}