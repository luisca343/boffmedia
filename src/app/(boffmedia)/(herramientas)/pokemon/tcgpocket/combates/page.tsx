import { boffGET } from "@/services/boffAPI"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InternalLink } from "@/components/nav/Link";

interface Battle {
  id: string;
  name: string;
  url: string;
}

interface BattleList {
  [location: string]: Battle[];
}

export default async function ListaCombates() {
  const data: BattleList = await boffGET(`/herramientas/ptcgp/solobattles`);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Lista de Combates</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {Object.entries(data).map(([location, battles]) => (
            <div key={location} className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{location}</h2>
              <div className="grid gap-2">
                {battles.map((battle) => (
                  <Button
                    key={battle.id}
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <InternalLink
                        href={'/tcgpocket/combates/' + battle.id}
                    >
                        {battle.name}
                    </InternalLink>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

