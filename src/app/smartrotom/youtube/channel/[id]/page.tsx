"use client";

import { useState, useEffect } from "react";
import Axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InternalLink } from "@/components/nav/Link";

interface ChannelInfo {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    resourceId: {
        videoId: string;
    }
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    publishedAt: string;
  };
}

const API_KEY = "AIzaSyAZ2J63sHYEtl_kRmL69Wka0isKJG4mj2g";

export default function YoutubeChannel({ params }: { params: { id: string } }) {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  useEffect(() => {
    fetchChannelInfo();
    fetchChannelContent();
  }, [params.id]);

  const fetchChannelInfo = async () => {
    try {
      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${params.id}&key=${API_KEY}`
      );
      setChannelInfo(response.data.items[0]);
    } catch (error) {
      console.error("Error fetching channel info:", error);
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
      const uploadsPlaylistId = await fetchUploadsPlaylistId();
      if (!uploadsPlaylistId) return;

      const response = await Axios.get(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`
      );

      console.log(response.data.items);

      const newVideos = response.data.items;

      if (pageToken) {
        setVideos((prevVideos) => [...newVideos, ...prevVideos]);
      } else {
        setVideos(newVideos);
      }

      setNextPageToken(response.data.nextPageToken || null);
    } catch (error) {
      console.error("Error fetching channel content:", error);
    }
  };

  const loadMoreContent = () => {
    if (nextPageToken) {
      fetchChannelContent(nextPageToken);
    }
  };

  if (!channelInfo) {
    return <div className="text-center p-8">Loading...</div>;
  }

  const VideoGrid = ({ items }: { items: Video[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <InternalLink
          href={`/youtube/video/${item.snippet.resourceId.videoId}`}
          key={item.id.videoId}
          className="group bg-surface-3 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-3"
        >
          <div className="relative">
            <img
              src={item.snippet.thumbnails.medium.url}
              alt={item.snippet.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-red-500 transition-colors duration-300">
              {item.snippet.title}
            </h3>
            <p className="text-sm text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
              {new Date(item.snippet.publishedAt).toLocaleDateString()}
            </p>
          </div>
        </InternalLink>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-2 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
          <img
            src={channelInfo.snippet.thumbnails.medium.url}
            alt={channelInfo.snippet.title}
            className="w-32 h-32 rounded-full mb-4 md:mb-0 md:mr-6"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {channelInfo.snippet.title}
            </h1>
            <p className="text-text-tertiary mb-4">
              {channelInfo.snippet.description}
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <span>
                {parseInt(
                  channelInfo.statistics.subscriberCount
                ).toLocaleString()}{" "}
                subscribers
              </span>
              <span>
                {parseInt(channelInfo.statistics.videoCount).toLocaleString()}{" "}
                videos
              </span>
              <span>
                {parseInt(channelInfo.statistics.viewCount).toLocaleString()}{" "}
                views
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Videos</h2>
        <VideoGrid items={videos} />

        {nextPageToken && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMoreContent}
              className="bg-red-600 hover:bg-red-700"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}