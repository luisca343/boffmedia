import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { DollarSign, Gift, Info, Key, Tag, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SteamGame } from "../_hooks/useFetchSteamData";

interface ImprovedDialogProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  selectedGame: SteamGame | null;
}

export function SteamDialog({
  isModalVisible,
  setIsModalVisible,
  selectedGame,
}: ImprovedDialogProps) {
  const [activeTab, setActiveTab] = useState("info");

  if (!selectedGame) return null;

  return (
    <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
      <DialogContent className="sm:max-w-[700px] xl:max-w-[1200px] bg-gray-900 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Gift className="w-6 h-6" />
            {selectedGame.name}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger
              value="info"
              className="text-gray-300 data-[state=active]:text-cyan-400"
            >
              <Info className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="text-gray-300 data-[state=active]:text-cyan-400"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>
            <TabsTrigger
              value="trailers"
              className="text-gray-300 data-[state=active]:text-cyan-400"
            >
              <Video className="w-4 h-4 mr-2" />
              Tráilers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-4">
            <ScrollArea className="sm:h-[300px] xl:h-[600px] rounded-md border border-gray-700 p-4">
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">
                Descripción
              </h3>
              <div
                dangerouslySetInnerHTML={{ __html: selectedGame.description }}
              />
              <h3 className="text-lg font-semibold mb-2 text-cyan-400 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Géneros
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedGame.genres.map((genre, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-700 text-cyan-400"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="pricing" className="mt-4">
            <div className="space-y-4">
              {selectedGame.normalPrice !== selectedGame.currentPrice && (
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">Precio Normal:</span>
                  <span className="text-2xl font-bold text-gray-100">
                    {selectedGame.normalPrice}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Precio Actual:</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {selectedGame.currentPrice}
                </span>
              </div>
              {selectedGame.normalPrice !== selectedGame.currentPrice && (
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">Descuento:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {selectedGame.discountPercent} %
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="trailers" className="mt-4">
            <ScrollArea className="sm:h-[300px] xl:h-[600px]">
              <div className="grid grid-cols-2 gap-4">
                {selectedGame.trailerImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <video
                      src={image}
                      className="w-full h-auto object-cover rounded-lg"
                      controls
                    />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <DialogClose asChild>
          <Button
            variant="secondary"
            className="mt-4 w-full bg-cyan-400 text-gray-900 hover:bg-cyan-500"
          >
            Cerrar
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
