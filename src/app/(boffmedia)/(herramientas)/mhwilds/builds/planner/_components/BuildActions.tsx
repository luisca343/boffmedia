import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";

export function BuildActions() {
  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardContent className="pt-4">
        <Button className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white">
          <Sparkles className="mr-2 h-4 w-4" /> Autocompletar Build
        </Button>
        <Button variant="outline" className="w-full text-surface-300">
          <Download className="mr-2 h-4 w-4" /> Exportar Build
        </Button>
      </CardContent>
    </Card>
  );
}