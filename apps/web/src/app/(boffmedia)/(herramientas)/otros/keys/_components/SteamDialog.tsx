import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/primitives/dialog";
import { 
  DollarSign, 
  Gift, 
  Info, 
  Tag, 
  Video, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Calendar, 
  Monitor,
  ExternalLink,
  Star,
  ShoppingBag
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Badge } from "@/components/ui/primitives/badge";
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
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reset tab and media index when opening a new game
  useEffect(() => {
    if (isModalVisible) {
      setActiveTab("info");
      setSelectedMediaIndex(0);
      setIsImageLoading(true);
    }
  }, [isModalVisible, selectedGame]);

  const handlePreviousMedia = useCallback(() => {
    setIsImageLoading(true);
    setSelectedMediaIndex((prev) => 
      prev > 0 ? prev - 1 : (selectedGame?.media?.length || 1) - 1
    );
  }, [selectedGame?.media]);

  const handleNextMedia = useCallback(() => {
    setIsImageLoading(true);
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

  // Format release date
  const formatReleaseDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
      <DialogContent className="sm:max-w-[700px] xl:max-w-[1200px] bg-surface-900 text-surface-100 border border-surface-700 p-0 overflow-hidden">
        {/* Game Header with Banner */}
        <div className="relative w-full h-40 md:h-60 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 to-transparent z-10" />
          <img 
            src={selectedGame.headerImage || selectedGame.screenshots?.[0]} 
            alt={selectedGame.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.opacity = '0.3';
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
                <img 
                  src={selectedGame.headerImage} 
                  alt={selectedGame.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-surface-800"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></div>';
                    }
                  }}
                />
              </div>
              
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-surface-50">
                  {selectedGame.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {selectedGame.developers && selectedGame.developers[0] && (
                    <span className="text-sm text-secondary-400">
                      {selectedGame.developers[0]}
                    </span>
                  )}
                  <span className="text-surface-400 text-sm">
                    • {formatReleaseDate(selectedGame.releaseDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-4 pt-2 pb-4">
          <TabsList className="grid w-full grid-cols-3 bg-surface-800">
            <TabsTrigger
              value="info"
              className="text-surface-300 data-[state=active]:text-secondary-400 data-[state=active]:bg-surface-700"
            >
              <Info className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="text-surface-300 data-[state=active]:text-secondary-400 data-[state=active]:bg-surface-700"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="text-surface-300 data-[state=active]:text-secondary-400 data-[state=active]:bg-surface-700"
            >
              <Video className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>
          
          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-6 px-1">
            {/* Game Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-secondary-400 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Descripción
                </h3>
                <ScrollArea className="h-[250px] md:h-[300px] rounded-md border border-surface-700 p-4 bg-surface-800/50">
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedGame.description }}
                    className="text-surface-300 prose prose-invert max-w-none prose-headings:text-secondary-400 prose-a:text-secondary-400"
                  />
                </ScrollArea>
              </div>
              
              <div className="space-y-4">
                {/* Game Metadata */}
                <div className="bg-surface-800 border border-surface-700 rounded-lg p-4 space-y-3">
                  {/* Developers */}
                  {selectedGame.developers && selectedGame.developers.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-surface-400">Desarrollador</h4>
                        <p className="text-surface-100">{selectedGame.developers.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Publishers */}
                  {selectedGame.publishers && selectedGame.publishers.length > 0 && (
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-surface-400">Editor</h4>
                        <p className="text-surface-100">{selectedGame.publishers.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Release Date */}
                  {selectedGame.releaseDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-surface-400">Fecha de lanzamiento</h4>
                        <p className="text-surface-100">{formatReleaseDate(selectedGame.releaseDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Platforms */}
                  {selectedGame.platforms && (
                    <div className="flex items-start gap-3">
                      <Monitor className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-surface-400">Plataformas</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedGame.platforms.windows && (
                            <Badge variant="outline" className="border-secondary-500/30 text-secondary-400">
                              Windows
                            </Badge>
                          )}
                          {selectedGame.platforms.mac && (
                            <Badge variant="outline" className="border-secondary-500/30 text-secondary-400">
                              macOS
                            </Badge>
                          )}
                          {selectedGame.platforms.linux && (
                            <Badge variant="outline" className="border-secondary-500/30 text-secondary-400">
                              Linux
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Genres */}
                {selectedGame.genres && selectedGame.genres.length > 0 && (
                  <div className="bg-surface-800 border border-surface-700 rounded-lg p-4">
                    <h3 className="text-md font-semibold mb-3 text-secondary-400 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Géneros
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.genres.map((genre, index) => (
                        <Badge
                          key={index}
                          className="bg-surface-700/50 hover:bg-surface-700 text-surface-100"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Website Link */}
                {selectedGame.website && (
                  <a 
                    href={selectedGame.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visitar sitio web
                  </a>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-4 px-1">
            <div className="bg-surface-800 border border-surface-700 rounded-lg p-6">
              {/* Current Price Card */}
              <div className="flex flex-col items-center justify-center">
                {selectedGame.normalPrice !== selectedGame.currentPrice && (
                  <div className="bg-highlight-600/20 text-highlight-400 py-1 px-3 rounded-full text-sm mb-2 flex items-center">
                    <Star className="w-3.5 h-3.5 mr-1" />
                    <span>-{selectedGame.discountPercent}% de descuento</span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl text-surface-300 mb-1">Precio actual</h3>
                  <div className="flex items-center justify-center gap-3">
                    {selectedGame.normalPrice !== selectedGame.currentPrice && (
                      <span className="text-xl text-surface-400 line-through">
                        {selectedGame.normalPrice}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-secondary-400">
                      {selectedGame.currentPrice === '0€' ? 'Gratis' : selectedGame.currentPrice}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Price History Card */}
              <div className="mt-8 border-t border-surface-700 pt-8">
                <h3 className="text-lg font-semibold mb-4 text-secondary-400 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Información de precio
                </h3>
                
                <div className="space-y-4">
                  {/* Regular Price */}
                  <div className="flex justify-between items-center p-3 bg-surface-700/50 rounded-lg">
                    <span className="text-surface-300">Precio regular:</span>
                    <span className="font-medium text-surface-100">
                      {selectedGame.normalPrice}
                    </span>
                  </div>
                  
                  {/* Sale Price */}
                  {selectedGame.normalPrice !== selectedGame.currentPrice && (
                    <div className="flex justify-between items-center p-3 bg-surface-700/50 rounded-lg">
                      <span className="text-surface-300">Precio en oferta:</span>
                      <span className="font-medium text-highlight-400">
                        {selectedGame.currentPrice}
                      </span>
                    </div>
                  )}
                  
                  {/* Discount */}
                  {selectedGame.normalPrice !== selectedGame.currentPrice && (
                    <div className="flex justify-between items-center p-3 bg-surface-700/50 rounded-lg">
                      <span className="text-surface-300">Descuento:</span>
                      <span className="font-medium text-highlight-400">
                        {selectedGame.discountPercent} %
                      </span>
                    </div>
                  )}
                  
                  {/* Steam Link */}
                  <a 
                    href={`https://store.steampowered.com/app/${selectedGame.steamID}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center bg-[#1b2838] hover:bg-[#273c51] text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 15c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
                      <path d="M12.3 5.8L9.2 8.2c0 0-1.1-0.4-2.2-0.4l-3 3c0 0-0.1 0.1-0.1 0.2 0 0.3 0.3 0.6 0.6 0.6 0.1 0 0.2 0 0.3-0.1l2.7-1.8 0.5 0.9c0.2 0.4 0.7 0.5 1.1 0.3 0.4-0.2 0.5-0.7 0.3-1.1L8.9 9.2l2.7-1.1c0.7-0.3 1.1-1 1.1-1.8 0-0.2 0-0.5-0.1-0.7 -0.1-0.2-0.2-0.3-0.3-0.4 0 0 0 0 0 0 0 0 0 0 0 0 -0.3-0.3-0.6-0.5-1-0.6C10.6 4.4 10.1 4.7 9.8 5.2L9.7 5.4c0 0 0 0 0 0l-4.6 2c0-0.1-0.1-0.2-0.1-0.3 0-0.5 0.4-0.9 0.9-0.9 0 0 0 0 0.1 0l1.4 0.2c0 0 0.1 0 0.1 0 0.5 0 1-0.2 1.4-0.5l3.1-2.2c0.2-0.2 0.3-0.5 0.2-0.7 -0.1-0.3-0.3-0.4-0.5-0.4 -0.1 0-0.2 0-0.3 0.1l-2.9 1.6c-0.2 0.1-0.5 0.2-0.8 0.2 -0.1 0-0.2 0-0.3 0l-1.9-0.3c-0.9-0.1-1.8 0.6-1.9 1.5 -0.1 0.9 0.6 1.8 1.5 1.9l0.4 0.1 -0.8 1.5C5.2 9.7 5 10 5 10.4c0 0.8 0.7 1.5 1.5 1.5 0.3 0 0.5-0.1 0.8-0.2 0.1 0 0.1-0.1 0.2-0.1l1.3-1.3c0.4 0.1 0.7 0.2 1.1 0.2 0.7 0 1.4-0.3 1.9-0.8l3.2-2.6c0.1-0.1 0.2-0.2 0.2-0.4C13.4 6.2 13 5.7 12.3 5.8z"/>
                    </svg>
                    Ver en Steam
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Media Tab */}
          <TabsContent value="media" className="mt-4 px-1">
            <div className="space-y-4">
              {/* Media Viewer */}
              <div className="relative aspect-video bg-surface-800 rounded-lg overflow-hidden border border-surface-700">
                {/* Loading spinner */}
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
                    <div className="animate-spin w-8 h-8 border-3 border-secondary-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  {selectedGame.media && selectedGame.media[selectedMediaIndex] && (
                    (() => {
                      const isVideo = "thumbnail" in selectedGame.media[selectedMediaIndex];
                      
                      if (isVideo) {
                        const video = selectedGame.media[selectedMediaIndex] as any;
                        return (
                          <motion.video
                            key={`video-${selectedMediaIndex}`}
                            src={video.mp4[480]}
                            className="w-full h-full object-cover"
                            controls
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onLoadedData={() => setIsImageLoading(false)}
                          />
                        );
                      } else {
                        const image = selectedGame.media[selectedMediaIndex] as any;
                        return (
                          <motion.img
                            key={`image-${selectedMediaIndex}`}
                            src={image.path_full || image.path_thumbnail}
                            alt={`Media ${selectedMediaIndex + 1}`}
                            className="w-full h-full object-contain"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => setIsImageLoading(false)}
                          />
                        );
                      }
                    })()
                  )}
                </AnimatePresence>
                
                {/* Navigation buttons */}
                {selectedGame.media && selectedGame.media.length > 1 && (
                  <>
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
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              {selectedGame.media && selectedGame.media.length > 1 && (
                <ScrollArea className="w-full">
                  <div className="flex space-x-2 pb-4">
                    {selectedGame.media?.map((media, index) => {
                      const isVideo = "thumbnail" in media;
                      return (
                        <motion.div
                          key={index}
                          className={`relative cursor-pointer rounded overflow-hidden ${
                            index === selectedMediaIndex ? "ring-2 ring-secondary-500" : ""
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          onClick={() => {
                            setIsImageLoading(true);
                            setSelectedMediaIndex(index);
                          }}
                        >
                          <img
                            src={isVideo ? (media as any).thumbnail : (media as any).path_thumbnail}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-24 h-14 object-cover"
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
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-4 pt-0">
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="mt-4 w-full bg-secondary-600 text-white hover:bg-secondary-700 transition-colors duration-200"
            >
              Cerrar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}