import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { DollarSign, Gift, Info, Tag, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SteamGame } from "../_hooks/useFetchSteamData";

interface ImprovedDialogProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  selectedGame: SteamGame | null;
}

export default function SteamDialog({
  isModalVisible,
  setIsModalVisible,
  selectedGame,
}: ImprovedDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);


  const handlePreviousMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => 
      prev > 0 ? prev - 1 : (selectedGame?.media?.length || 1) - 1
    );
  }, [selectedGame?.media]);

  const handleNextMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => 
      prev < (selectedGame?.media?.length || 1) - 1 ? prev + 1 : 0
    );
  }, [selectedGame?.media]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab === "media") {
        if (event.key === "ArrowLeft") {
          handlePreviousMedia();
        } else if (event.key === "ArrowRight") {
          handleNextMedia();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, handlePreviousMedia, handleNextMedia]);

  if (!selectedGame) return null;
  return (
    <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
      <DialogContent className="sm:max-w-[700px] xl:max-w-[1200px] bg-main-900 text-main-100 border border-main-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600 flex items-center gap-2">
            <Gift className="w-6 h-6 text-orange-400" />
            {selectedGame.name}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-main-800">
            <TabsTrigger
              value="info"
              className="text-main-300 data-[state=active]:text-orange-400 data-[state=active]:bg-main-700"
            >
              <Info className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="text-main-300 data-[state=active]:text-orange-400 data-[state=active]:bg-main-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="text-main-300 data-[state=active]:text-orange-400 data-[state=active]:bg-main-700"
            >
              <Video className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-4">
            <ScrollArea className="sm:h-[300px] xl:h-[600px] rounded-md border border-main-700 p-4">
              <h3 className="text-lg font-semibold mb-2 text-orange-400">
                Descripción
              </h3>
              <div 
                dangerouslySetInnerHTML={{ __html: selectedGame.description }}
                className="text-main-300 w-[616px]"
              />
              <h3 className="text-lg font-semibold mb-2 mt-4 text-orange-400 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Géneros
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedGame.genres ? (
                  selectedGame.genres.map((genre, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-main-700 text-orange-400"
                    >
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <span className="text-main-300">No hay géneros</span>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="pricing" className="mt-4">
            <div className="space-y-4">
              {selectedGame.normalPrice !== selectedGame.currentPrice && (
                <div className="flex justify-between items-center p-4 bg-main-800 rounded-lg">
                  <span className="text-main-300">Precio Normal:</span>
                  <span className="text-2xl font-bold text-main-100">
                    {selectedGame.normalPrice}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 bg-main-800 rounded-lg">
                <span className="text-main-300">Precio Actual:</span>
                <span className="text-2xl font-bold text-orange-400">
                  {selectedGame.currentPrice}
                </span>
              </div>
              {selectedGame.normalPrice !== selectedGame.currentPrice && (
                <div className="flex justify-between items-center p-4 bg-main-800 rounded-lg">
                  <span className="text-main-300">Descuento:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {selectedGame.discountPercent} %
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="media" className="mt-4">
            <div className="space-y-4">
              <div className="relative aspect-video">
              <AnimatePresence mode="wait">
                {selectedGame.media && selectedGame.media[selectedMediaIndex] && (
                  (() => {
                    const isVideo = "thumbnail" in selectedGame.media[selectedMediaIndex];
                    if (isVideo) {
                      const video = selectedGame.media[selectedMediaIndex] as any
                      return (
                        <motion.video
                          key={`video-${selectedMediaIndex}`}
                          src={video.mp4[480]}
                          className="w-full h-full object-cover rounded-lg"
                          controls
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    } else {
                      const image = selectedGame.media[selectedMediaIndex] as any
                      return (
                        <motion.img
                          key={`image-${selectedMediaIndex}`}
                          src={image.path_thumbnail}
                          alt={`Media ${selectedMediaIndex + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    }
                  })()
                )}
              </AnimatePresence>
                <button
                  onClick={handlePreviousMedia}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  aria-label="Previous media"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextMedia}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  aria-label="Next media"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              <ScrollArea className="w-full">
                <div className="flex space-x-2 pb-4">
                  {selectedGame.media?.map((media, index) => {
                    const isVideo = "thumbnail" in media;
                    return (
                      <motion.div
                        key={index}
                        className={`relative cursor-pointer ${
                          index === selectedMediaIndex ? "ring-2 ring-orange-500" : ""
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedMediaIndex(index)}
                      >
                        <img
                          src={isVideo ? media.thumbnail : media.path_thumbnail}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-24 h-14 object-cover rounded"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-0.5"></div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
        <DialogClose asChild>
          <Button
            variant="secondary"
            className="mt-4 w-full bg-orange-600 text-white hover:bg-orange-700 transition-colors duration-200"
          >
            Cerrar
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}