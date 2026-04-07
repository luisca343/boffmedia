"use client";

import { useState, useEffect } from "react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { UserHeader } from "../_components/UserHeader";
import { UserTabs } from "../_components/UserTabs";
import { TwitchUser, TwitchVideo, TwitchClip, TwitchStream } from "../../types";
import { twitchAPI } from "../../_services/twitchAPI";
import { useTranslations } from "next-intl";

export default function UserPage({ params }: { params: { username: string } }) {
  const t = useTranslations("twitch");
  const [userData, setUserData] = useState<TwitchUser | null>(null);
  const [videos, setVideos] = useState<TwitchVideo[]>([]);
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [streamData, setStreamData] = useState<TwitchStream | null>(null);
  const [followerCount, setFollowerCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get user data from Twitch API
        const user = await twitchAPI.getUserByUsername(params.username);
        
        if (user) {
          setUserData(user);
          
          // Fetch user's videos, clips, and stream status in parallel
          const [userVideos, userClips, currentStream] = await Promise.all([
            twitchAPI.getUserVideos(user.id, 12),
            twitchAPI.getUserClips(user.id, 12),
            twitchAPI.getStreamByUsername(params.username)
          ]);
          
          setVideos(userVideos);
          setClips(userClips);
          setStreamData(currentStream);
          
          try {
            console.log("Fetching follower count for user:", user.id);
            const followers = await twitchAPI.getFollowerCount(user.id);
            console.log("Follower count fetched:", followers);
            console.log(user)
            setFollowerCount(followers);
          } catch {
            // Follower count not available
            setFollowerCount(undefined);
          }
        } else {
          setError(t("user.notFound"));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(t("user.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [params.username, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.user")} />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-full bg-surface-900 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-surface-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error || t("user.notFound")}</p>
          <InternalLink href="twitch" className="text-purple-400 hover:underline">
            {t("user.returnToBrowse")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <UserHeader 
        displayName={userData.display_name}
        login={userData.login}
        profileImageUrl={userData.profile_image_url}
        offlineImageUrl={userData.offline_image_url}
        viewCount={userData.view_count}
        followerCount={followerCount}
        description={userData.description}
        createdAt={userData.created_at}
        broadcasterType={userData.broadcaster_type}
      />
      
      <div className="container mx-auto px-4 py-8">
        <UserTabs 
          videos={videos}
          clips={clips}
          streamData={streamData}
          description={userData.description}
          createdAt={userData.created_at}
          viewCount={userData.view_count}
          followerCount={followerCount}
        />
      </div>
    </div>
  );
}
