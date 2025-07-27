import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface Game {
  title: string;
  description: string;
  image: string;
  status: string;
  link: string;
}

interface GamesGridProps {
  games: Game[];
  t: (key: string) => string;
}

export function GamesGrid({ games, t }: GamesGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-12">
      {games.map((game, index) => (
        <Card key={game.title} className="group relative bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 min-h-[420px] flex flex-col justify-between">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10 pt-8 pb-4 flex flex-col items-center">
            <div className="absolute top-6 right-6">
              <Badge
                variant={game.status === t("featuredGames.status.new") ? "default" : "secondary"}
                className={game.status === t("featuredGames.status.new")
                  ? "bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white border-0"
                  : ""}
              >
                {game.status}
              </Badge>
            </div>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-400/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Image
                src={game.image || "/placeholder.svg"}
                alt={game.title}
                width={120}
                height={120}
                className="relative rounded-xl mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg"
              />
            </div>
            <CardTitle className="text-3xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-amber-400 transition-all duration-300 text-center">
              {game.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col flex-1 justify-between">
            <CardDescription className="text-lg text-surface-300 mb-8 group-hover:text-surface-200 transition-colors duration-300 text-center">
              {game.description}
            </CardDescription>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg py-4 rounded-xl flex items-center justify-center gap-2" asChild>
              <Link href={game.link}>
                {t("featuredGames.viewMore")}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}