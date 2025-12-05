import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Button } from "@/components/ui/primitives/button";
import { InternalLink } from "@/components/ui/navigation/Link";
import { Separator } from "@/components/ui/primitives/separator";
import { boffGET } from "@/services/boffAPI";
import { MapPin } from "lucide-react";

type Battle = {
  id: string;
  name: string;
  url: string;
};

type BattlesData = {
  [location: string]: Battle[];
};

export default async function CombatesPage() {
  
  /*
  const data = (await boffGET('/herramientas/ptcgp/solobattles')).data as any as BattlesData;
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">Pokémon TCG Pocket - Combates</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[75vh] pr-4">
          <div className="grid gap-6">
            {Object.entries(data).reverse().map(([location, battles]) => (
              <Card key={location} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    <CardTitle className="text-lg font-semibold">{location}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid gap-2">
                  {battles.map((battle) => (
                    <Button
                      key={battle.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left hover:bg-accent transition-colors"
                      asChild
                    >
                      <InternalLink href={`/tcgpocket/combates/${battle.id}`}>
                        {battle.name}
                      </InternalLink>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );*/
}