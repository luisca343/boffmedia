"use client";

import { useState, useEffect } from "react";
import Axios from "axios";
import { InternalLink } from "@/components/nav/Link";
import { LoadingSpinner } from "../../_components/LoadingSpinner";
import { ChannelHeader } from "../_components/ChannelHeader";
import { ChannelTabs } from "../_components/ChannelTabs";
import { ChannelInfo, Video, API_KEY, formatNumber, formatDate } from "../../types";
import { useTranslations } from "next-intl";

export default function YoutubeChannel({ params }: { params: { id: string } }) {
  const t = useTranslations("youtube");
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [popularVideos, setPopularVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchChannelInfo();
  }, [params.id]);

  const fetchChannelInfo = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${params.id}&key=${API_KEY}`
      );
      
      if (response.data.items && response.data.items.length > 0) {
        setChannelInfo(response.data.items[0]);
        await fetchChannelContent();
        await fetchPopularVideos();
      }
    } catch (error) {
      console.error("Error fetching channel info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadsPlaylistId = async () => {
    try {
      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${params.id}&key=${API_KEY}`
      );

      const uploadsPlaylistId =
        response.data.items[0].contentDetails.relatedPlaylists.uploads;
      return uploadsPlaylistId;
    } catch (error) {
      console.error("Error fetching uploads playlist ID:", error);
      return null;
    }
  };

  const fetchChannelContent = async (pageToken: string | null = null) => {
    try {
      setLoadingMore(pageToken !== null);
      const uploadsPlaylistId = await fetchUploadsPlaylistId();
      if (!uploadsPlaylistId) return;
  
      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=24&key=${API_KEY}${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`
      );
  
      const newVideos = response.data.items.map((item: any) => ({
        ...item,
        // Ensure ID exists in a consistent location for use in our app
        id: {
          videoId: item.snippet.resourceId.videoId,
          kind: "youtube#video"
        },
        etag: item.etag || Date.now().toString()
      }));
  
      if (pageToken) {
        setVideos((prevVideos) => [...prevVideos, ...newVideos]);
      } else {
        setVideos(newVideos);
      }
  
      setNextPageToken(response.data.nextPageToken || null);
    } catch (error) {
      console.error("Error fetching channel content:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchPopularVideos = async () => {
    try {
      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${params.id}&maxResults=10&order=viewCount&type=video&key=${API_KEY}`
      );

      if (response.data.items) {
        setPopularVideos(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching popular videos:", error);
    }
  };

  const loadMoreContent = () => {
    if (nextPageToken) {
      fetchChannelContent(nextPageToken);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.channel")} />
      </div>
    );
  }

  if (!channelInfo) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center text-white overflow-auto">
        <div className="text-center">
          <p className="text-xl mb-4">{t("channel.notFound")}</p>
          <InternalLink href="/youtube" className="text-blue-400 hover:underline">
            {t("channel.returnToSearch")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <ChannelHeader 
        title={channelInfo.snippet.title}
        thumbnailUrl={channelInfo.snippet.thumbnails.high?.url || channelInfo.snippet.thumbnails.medium.url}
        bannerUrl={channelInfo.brandingSettings?.image?.bannerExternalUrl}
        subscriberCount={channelInfo.statistics.subscriberCount}
        videoCount={channelInfo.statistics.videoCount}
        viewCount={channelInfo.statistics.viewCount}
        customUrl={channelInfo.snippet.customUrl}
        description={channelInfo.snippet.description}
        formatNumber={formatNumber}
      />
      
      <div className="container mx-auto px-4 mt-6">
        <ChannelTabs 
          videos={videos}
          popularVideos={popularVideos}
          description={channelInfo.snippet.description}
          joinDate={channelInfo.snippet.publishedAt}
          viewCount={channelInfo.statistics.viewCount}
          videoCount={channelInfo.statistics.videoCount}
          subscriberCount={channelInfo.statistics.subscriberCount}
          formatDate={formatDate}
          nextPageToken={nextPageToken}
          loadingMore={loadingMore}
          onLoadMore={loadMoreContent}
        />
      </div>
    </div>
  );
}