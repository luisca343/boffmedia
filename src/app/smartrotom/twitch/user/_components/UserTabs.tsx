"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import { ContentGrid } from "../../_components/ContentGrid";
import { UserStats } from "./UserStats";
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
  const t = useTranslations("twitch");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="bg-surface-800 border-b border-surface-700 w-full rounded-lg mb-6">
        {streamData && (
          <TabsTrigger 
            value="live" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            🔴 {t("live")}
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="videos" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("user.videos")}
        </TabsTrigger>
        <TabsTrigger 
          value="clips" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("user.clips")}
        </TabsTrigger>
        <TabsTrigger 
          value="about" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          {t("user.about")}
        </TabsTrigger>
      </TabsList>
      
      {streamData && (
        <TabsContent value="live" className="mt-0">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
            🔴 {t("live")}
          </h2>
          
          <div className="bg-surface-800 rounded-lg p-6">
            <div className="aspect-video bg-surface-700 rounded-lg mb-4 overflow-hidden">
              <iframe
                src={`https://player.twitch.tv/?channel=${streamData.user_login}&parent=localhost&autoplay=false`}
                height="100%"
                width="100%"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{streamData.title}</h3>
                <p className="text-surface-300">{streamData.game_name}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-surface-400">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-red-500" />
                  <span>{streamData.viewer_count.toLocaleString()} {t("viewers")}</span>
                </div>
                <div>
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    {t("live")}
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
          {t("user.videos")}
        </h2>
        
        <ContentGrid 
          videos={videos} 
          emptyMessage={t("user.noVideos")}
        />
      </TabsContent>
      
      <TabsContent value="clips" className="mt-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
          {t("user.clips")}
        </h2>
        
        <ContentGrid 
          clips={clips}
          emptyMessage={t("user.noClips")}
        />
      </TabsContent>
      
      <TabsContent value="about" className="mt-0">
        <div className="bg-surface-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
            {t("user.about")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-surface-700 rounded p-4">
                <h3 className="text-lg font-medium mb-2">{t("user.description")}</h3>
                <p className="text-surface-300 whitespace-pre-line">
                  {description || t("user.noDescription")}
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
