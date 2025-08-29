"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import { ContentGrid } from "../../_components/ContentGrid";
import { UserStats } from "./UserStats";
import { TwitchPlayer } from "../../stream/_components/TwitchPlayer";
import { TwitchVideo, TwitchClip, TwitchStream } from "../../types";
import { useTranslations } from "next-intl";

interface UserTabsProps {
  videos: TwitchVideo[];
  clips: TwitchClip[];
  streamData: TwitchStream | null;
  description: string;
  createdAt: string;
  viewCount: number;
  followerCount?: number;
}

export const UserTabs = ({
  videos,
  clips,
  streamData,
  description,
  createdAt,
  viewCount,
  followerCount
}: UserTabsProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Default to live tab if user is streaming, otherwise videos
    return streamData ? "live" : "videos";
  });
  const t = useTranslations("common");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="bg-surface-800 border-b border-surface-700 w-full rounded-lg mb-6">
        {streamData && (
          <TabsTrigger 
            value="live" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            🔴 {t("content.live")}
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="videos" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("content.videos")}
        </TabsTrigger>
        <TabsTrigger 
          value="clips" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("content.clips")}
        </TabsTrigger>
        <TabsTrigger 
          value="about" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("content.about")}
        </TabsTrigger>
      </TabsList>
      
      {streamData && (
        <TabsContent value="live" className="mt-0">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
            🔴 {t("content.live")}
          </h2>
          
          <div className="bg-surface-800 rounded-lg p-6">
            <div className="h-full bg-surface-700 rounded-lg mb-4 overflow-hidden">
              <TwitchPlayer 
                channel={streamData.user_login}
                layout="video-with-chat"
                autoplay={true}
                height="600px"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{streamData.title}</h3>
                <p className="text-surface-300">{streamData.game_name}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-surface-400">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-red-500" />
                  <span>{streamData.viewer_count.toLocaleString()} {t("content.viewers")}</span>
                </div>
                <div>
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    {t("content.live")}
                  </span>
                </div>
              </div>
              
              {streamData.tags && streamData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {streamData.tags.map((tag, index) => (
                    <span key={index} className="bg-surface-700 text-surface-300 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      )}
      
      <TabsContent value="videos" className="mt-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
          {t("content.videos")}
        </h2>
        
        <ContentGrid 
          videos={videos} 
          emptyMessage={t("content.noVideos")}
        />
      </TabsContent>
      
      <TabsContent value="clips" className="mt-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
          {t("content.clips")}
        </h2>
        
        <ContentGrid 
          clips={clips}
          emptyMessage={t("content.noClips")}
        />
      </TabsContent>
      
      <TabsContent value="about" className="mt-0">
        <div className="bg-surface-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
            {t("content.about")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-surface-700 rounded p-4">
                <h3 className="text-lg font-medium mb-2">{t("content.description")}</h3>
                <p className="text-surface-300 whitespace-pre-line">
                  {description || t("content.noDescription")}
                </p>
              </div>
            </div>
            
            <UserStats 
              createdAt={createdAt}
              viewCount={viewCount}
              followerCount={followerCount}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
