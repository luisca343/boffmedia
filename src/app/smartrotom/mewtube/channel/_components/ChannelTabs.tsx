"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { ChevronDown } from "lucide-react";
import { VideoGrid } from "../../_components/VideoGrid";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { ChannelStats } from "./ChannelStats";
import { Video } from "../../types";
import { useTranslations } from "next-intl";

interface ChannelTabsProps {
  videos: Video[];
  popularVideos: Video[];
  description: string;
  joinDate: string;
  viewCount: string;
  videoCount: string;
  subscriberCount: string;
  formatDate: (date: string) => string;
  nextPageToken: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export const ChannelTabs = ({
  videos,
  popularVideos,
  description,
  joinDate,
  viewCount,
  videoCount,
  subscriberCount,
  formatDate,
  nextPageToken,
  loadingMore,
  onLoadMore
}: ChannelTabsProps) => {
  const [activeTab, setActiveTab] = useState("videos");
  const t = useTranslations("common");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="bg-surface-800 border-b border-surface-700 w-full rounded-lg mb-6">
        <TabsTrigger 
          value="videos" 
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          {t("content.videos")}
        </TabsTrigger>
        <TabsTrigger 
          value="popular" 
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          {t("content.popularVideos")}
        </TabsTrigger>
        <TabsTrigger 
          value="about" 
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          {t("content.about")}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="videos" className="mt-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
          {t("content.videos")}
        </h2>
        
        <VideoGrid videos={videos} formatDate={formatDate} />
        
        {nextPageToken && (
          <div className="text-center mt-8">
            <Button
              onClick={onLoadMore}
              className="bg-red-600 hover:bg-red-700 transition-colors"
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <LoadingSpinner size="small" />
                  {t("loading.text")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {t("actions.loadMore")}
                </>
              )}
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="popular" className="mt-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
          {t("content.popularVideos")}
        </h2>
        
        <VideoGrid 
          videos={popularVideos}
          emptyMessage={t("content.noPopular")}
          formatDate={formatDate}
        />
      </TabsContent>
      
      <TabsContent value="about" className="mt-0">
        <div className="bg-surface-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
            {t("content.about")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-medium mb-4">{t("content.description")}</h3>
              <p className="text-surface-300 whitespace-pre-line">
                {description || t("content.noDescription")}
              </p>
            </div>
            
            <div className="md:col-span-1">
              <ChannelStats
                joinDate={joinDate}
                viewCount={viewCount}
                videoCount={videoCount}
                subscriberCount={subscriberCount}
                formatDate={formatDate}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};