"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Axios from "axios";
import Link from "next/link";
import { InternalLink } from "@/components/nav/Link";

interface Video {
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
}

export default function YoutubeResults() {
  const [busqueda, setBusqueda] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);

  const handleSearch = async () => {
    try {
      const res = await Axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=AIzaSyAZ2J63sHYEtl_kRmL69Wka0isKJG4mj2g&part=snippet&q=${busqueda}&maxResults=25`
      );
      setVideos(res.data.items);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  return (
<div className="min-h-screen bg-surface-2 text-white">
      <header className="sticky top-0 z-10 bg-surface-3 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-grow mr-2 bg-surface-3 text-white placeholder-main-400 border-border-dark"
            placeholder="Search YouTube"
          />
          <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-700">
            Search
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => {
            if (video.id.kind === "youtube#channel") {
              return (
                <InternalLink
                  href={`/youtube/channel/${video.snippet.channelId}`}
                  key={video.etag}
                  className="bg-surface-3 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-3"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={video.snippet.thumbnails.high.url}
                      alt={video.snippet.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold line-clamp-2 mb-1 group-hover:text-red-500 transition-colors duration-300">
                      {video.snippet.title}
                    </h3>
                    <p className="text-sm text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                      {video.snippet.channelTitle}
                    </p>
                  </div>
                </InternalLink>
              )
            }

            return (
              <InternalLink
                key={video.id.videoId}
                href={`/youtube/video/${video.id.videoId}`}
                className="group bg-surface-3 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-3"
              >
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img
                    src={video.snippet.thumbnails.high.url}
                    alt={video.snippet.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-2 mb-1 group-hover:text-red-500 transition-colors duration-300">
                    {video.snippet.title}
                  </h3>
                  <p className="text-sm text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                    {video.snippet.channelTitle}
                  </p>
                </div>
              </InternalLink>
            )
          })}
        </div>
      </main>
    </div>
  );
}
