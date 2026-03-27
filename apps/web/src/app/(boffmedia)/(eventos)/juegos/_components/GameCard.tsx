import { Game } from "@boffmedia/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { Calendar, Users, Trophy, ExternalLink, Gamepad2 } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  layout?: "grid" | "list";
  showEvents?: boolean;
}

export function GameCard({ game, layout = "grid", showEvents = true }: GameCardProps) {
  const isListLayout = layout === "list";
  const isActive = !game.deletedAt;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card className={cn(
      "group bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-accent-400/40 hover:shadow-2xl hover:shadow-accent-500/20",
      isListLayout && "flex md:flex-row",
      !isActive && "opacity-60"
    )}>
      <div className={cn(
        "relative",
        isListLayout ? "w-full md:w-48 h-48 md:h-auto" : "h-48"
      )}>
        {/* Game Icon/Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 to-secondary-600/20 flex items-center justify-center">
          {game.icon ? (
            <img 
              src={game.icon} 
              alt={game.title}
              className="w-20 h-20 object-contain rounded-lg"
            />
          ) : (
            <Gamepad2 className="w-20 h-20 text-accent-400" />
          )}
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "text-xs font-bold",
              isActive 
                ? "bg-success-500/80 text-white border-success-400/50" 
                : "bg-surface-600/80 text-surface-300 border-surface-500/50"
            )}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 via-transparent to-transparent"></div>
      </div>

      <div className={cn(
        "flex flex-col",
        isListLayout ? "flex-1" : ""
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">
                {game.title}
              </CardTitle>
              <CardDescription className="text-surface-300 line-clamp-2">
                {game.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col justify-between">
          <div className="space-y-3 mb-4">
            {/* Game Stats - These would come from related data */}
            <div className="flex items-center gap-4 text-sm text-surface-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Desde {formatDate(game.createdAt)}</span>
              </div>
              {/* These would be calculated from related events/players data */}
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>0 eventos</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>0 jugadores</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {showEvents && (
              <InternalLink href={`/eventos?game=${game.id}`} className="flex-1">
                <Button 
                  variant="accentOutline" 
                  className="w-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Eventos
                </Button>
              </InternalLink>
            )}
            
            <InternalLink href={`/juegos/${game.id}`} className="flex-1">
              <Button variant="accent" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Detalles
              </Button>
            </InternalLink>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
