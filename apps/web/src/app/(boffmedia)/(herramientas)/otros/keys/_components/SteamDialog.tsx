import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/primitives/dialog";
import {
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
  ShoppingBag,
  X,
  Key,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Badge } from "@/components/ui";
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
        if (event.key === "ArrowLeft") handlePreviousMedia();
        else if (event.key === "ArrowRight") handleNextMedia();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, handlePreviousMedia, handleNextMedia]);

  if (!selectedGame) return null;

  const formatReleaseDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
      <DialogContent className="sm:max-w-[720px] xl:max-w-[1105px] bg-surface-900 text-surface-100 border border-surface-700/60 p-0 overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">{selectedGame?.name}</DialogTitle>

        {/* Banner */}
        <div className="relative w-full h-44 md:h-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-900/60 to-transparent z-10" />

          <img
            src={selectedGame.headerImage || selectedGame.screenshots?.[0]}
            alt={selectedGame.name}
            className="w-full h-full object-cover scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.2";
            }}
          />

          <DialogClose className="absolute top-3 right-3 z-30 w-8 h-8 rounded-lg bg-surface-900/70 border border-surface-700/50 flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-all duration-150 backdrop-blur-sm">
            <X className="w-4 h-4" />
          </DialogClose>

          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
            <div className="flex items-end gap-4">
              <div className="w-14 h-14 bg-surface-800 border border-surface-600/60 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                <img
                  src={selectedGame.headerImage}
                  alt={selectedGame.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-surface-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></div>';
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight truncate">
                  {selectedGame.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  {selectedGame.developers?.[0] && (
                    <span className="text-sm text-secondary-400">{selectedGame.developers[0]}</span>
                  )}
                  {selectedGame.releaseDate && (
                    <span className="text-surface-500 text-sm">· {selectedGame.releaseDate}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-4 pt-3 pb-4">
          <TabsList className="grid w-full grid-cols-3 bg-surface-800/60 border border-surface-700/50 rounded-xl p-1">
            <TabsTrigger
              value="info"
              className="rounded-lg text-surface-400 data-[state=active]:text-secondary-300 data-[state=active]:bg-surface-700/80 data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Info className="w-3.5 h-3.5 mr-1.5" />
              Información
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="rounded-lg text-surface-400 data-[state=active]:text-secondary-300 data-[state=active]:bg-surface-700/80 data-[state=active]:shadow-sm transition-all duration-200"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Precio
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-lg text-surface-400 data-[state=active]:text-secondary-300 data-[state=active]:bg-surface-700/80 data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Video className="w-3.5 h-3.5 mr-1.5" />
              Media
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-4 px-0.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium mb-2 text-surface-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Descripción
                </h3>
                <ScrollArea className="h-[240px] md:h-[280px] rounded-xl border border-surface-700/50 p-4 bg-surface-800/40">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedGame.description }}
                    className="text-surface-300 prose prose-invert max-w-none prose-headings:text-secondary-400 prose-a:text-secondary-400 text-sm leading-relaxed"
                  />
                </ScrollArea>
              </div>

              <div className="space-y-3">
                <div className="bg-surface-800/40 border border-surface-700/50 rounded-xl p-4 space-y-3">
                  {selectedGame.developers?.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-surface-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-surface-500 mb-0.5">Desarrollador</p>
                        <p className="text-sm text-surface-100">{selectedGame.developers.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  {selectedGame.publishers?.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-surface-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-surface-500 mb-0.5">Editor</p>
                        <p className="text-sm text-surface-100">{selectedGame.publishers.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  {selectedGame.releaseDate && (
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-surface-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-surface-500 mb-0.5">Lanzamiento</p>
                        <p className="text-sm text-surface-100">{formatReleaseDate(selectedGame.releaseDate)}</p>
                      </div>
                    </div>
                  )}
                  {selectedGame.platforms && (
                    <div className="flex items-start gap-2.5">
                      <Monitor className="w-4 h-4 text-surface-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-surface-500 mb-1">Plataformas</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedGame.platforms.windows && (
                            <Badge variant="outline" className="text-xs border-surface-600 text-surface-300 bg-surface-800/50">Windows</Badge>
                          )}
                          {selectedGame.platforms.mac && (
                            <Badge variant="outline" className="text-xs border-surface-600 text-surface-300 bg-surface-800/50">macOS</Badge>
                          )}
                          {selectedGame.platforms.linux && (
                            <Badge variant="outline" className="text-xs border-surface-600 text-surface-300 bg-surface-800/50">Linux</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedGame.genres?.length > 0 && (
                  <div className="bg-surface-800/40 border border-surface-700/50 rounded-xl p-4">
                    <p className="text-xs text-surface-500 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Géneros
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGame.genres.map((genre, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-md bg-surface-700/60 border border-surface-600/50 text-surface-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGame.website && (
                  <a
                    href={selectedGame.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-secondary-600/20 border border-secondary-500/30 text-secondary-400 hover:bg-secondary-600/30 hover:text-secondary-300 transition-all duration-150 text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Sitio oficial
                  </a>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-4 px-0.5">
            <div className="bg-surface-800/40 border border-surface-700/50 rounded-xl p-6 space-y-6">
              <div className="flex flex-col items-center text-center gap-2">
                {selectedGame.normalPrice !== selectedGame.currentPrice && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-highlight-500/15 border border-highlight-500/25 text-highlight-400 text-sm">
                    <Star className="w-3 h-3" />
                    -{selectedGame.discountPercent}% de descuento
                  </span>
                )}
                <div className="flex items-center gap-3">
                  {selectedGame.normalPrice !== selectedGame.currentPrice && (
                    <span className="text-lg text-surface-500 line-through">{selectedGame.normalPrice}</span>
                  )}
                  <span className="text-4xl font-bold text-secondary-400">
                    {selectedGame.currentPrice === "0€" ? "Gratis" : selectedGame.currentPrice}
                  </span>
                </div>
              </div>

              <div className="border-t border-surface-700/50 pt-4 space-y-2">
                <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-surface-700/30">
                  <span className="text-sm text-surface-400">Precio regular</span>
                  <span className="text-sm font-medium text-surface-100">{selectedGame.normalPrice}</span>
                </div>
                {selectedGame.normalPrice !== selectedGame.currentPrice && (
                  <>
                    <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-surface-700/30">
                      <span className="text-sm text-surface-400">Precio en oferta</span>
                      <span className="text-sm font-medium text-highlight-400">{selectedGame.currentPrice}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-surface-700/30">
                      <span className="text-sm text-surface-400">Descuento</span>
                      <span className="text-sm font-medium text-highlight-400">{selectedGame.discountPercent}%</span>
                    </div>
                  </>
                )}
              </div>

              <a
                href={`https://store.steampowered.com/app/${selectedGame.steamID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#1b2838] hover:bg-[#2a475e] border border-[#2a475e] text-white transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.38-1.385c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.452 1.014zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
                </svg>
                Ver en Steam
              </a>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-4 px-0.5">
            <div className="space-y-3">
              <div className="relative aspect-video bg-surface-950 rounded-xl overflow-hidden border border-surface-700/50">
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
                    <div className="w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {selectedGame.media?.[selectedMediaIndex] && (
                    (() => {
                      const isVideo = "thumbnail" in selectedGame.media[selectedMediaIndex];
                      if (isVideo) {
                        const video = selectedGame.media[selectedMediaIndex] as any;
                        return (
                          <motion.video
                            key={`video-${selectedMediaIndex}`}
                            src={video.hls_h264 || video.dash_h264 || video.mp4?.[480]}
                            className="w-full h-full object-cover"
                            controls
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
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
                            transition={{ duration: 0.25 }}
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => setIsImageLoading(false)}
                          />
                        );
                      }
                    })()
                  )}
                </AnimatePresence>

                {selectedGame.media && selectedGame.media.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousMedia}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-900/70 hover:bg-surface-800 border border-surface-700/50 backdrop-blur-sm text-white rounded-lg flex items-center justify-center transition-all duration-150"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMedia}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-900/70 hover:bg-surface-800 border border-surface-700/50 backdrop-blur-sm text-white rounded-lg flex items-center justify-center transition-all duration-150"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {selectedGame.media && selectedGame.media.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {selectedGame.media.map((media, index) => {
                    const isVideo = "thumbnail" in media;
                    const active = index === selectedMediaIndex;
                    return (
                      <motion.button
                        key={index}
                        className={`relative flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-150 ${
                          active
                            ? "border-secondary-500/70 ring-1 ring-secondary-500/40"
                            : "border-surface-700/50 opacity-60 hover:opacity-100 hover:border-surface-500"
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => {
                          setIsImageLoading(true);
                          setSelectedMediaIndex(index);
                        }}
                      >
                        <img
                          src={isVideo ? (media as any).thumbnail : (media as any).path_thumbnail}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-20 h-12 object-cover"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-surface-900/30">
                            <div className="w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
