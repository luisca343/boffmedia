import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";

const battles = [
  { id: 1, name: "Battle 1" },
  { id: 2, name: "Battle 2" },
];

export default function CombatesPage() {
  return (
    <Card>
      <CardContent>
        <ScrollArea>
          {battles.map((battle) => (
            <div key={battle.id}>
              <Button
                key={battle.id}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <InternalLink href={'/tcgpocket/combates/' + battle.id}>
                  {battle.name}
                </InternalLink>
              </Button>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}