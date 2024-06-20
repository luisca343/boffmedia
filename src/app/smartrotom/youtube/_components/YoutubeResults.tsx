"use client"
import { InternalLink } from "@/components/nav/Link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import  Axios  from "axios"
import Image from "next/image"
import Link from "next/link";
import { useEffect, useState } from "react";


interface Video {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
}

export default  function YoutubeResults({}) {
  const [busqueda, setBusqueda] = useState('' as string);
  const [videos, setVideos] = useState([] as Video[]);

  return (
    <section className="flex flex-col items-center   bg-slate-800">
      <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}  className="self-start"/>
      <Button onClick={() => {
        Axios.get(`https://www.googleapis.com/youtube/v3/search?key=AIzaSyAZ2J63sHYEtl_kRmL69Wka0isKJG4mj2g&part=snippet&q=${busqueda}&maxResults=25`).then((res) => {
          setVideos(res.data.items);
        })
      }}>Buscar</Button>
      <div className="flex flex-col items-center">
        {videos.length > 0 && <Results videos={videos} />}
      </div>
      
  </section>
  )
}


export function Results({videos} : {videos: Video[]}) {
    return(
    
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {videos.map((video: Video) => {
                  if(video.id.kind == 'youtube#video') return <InternalLink key={video.id.videoId} className="flex flex-col items-center bg-slate-100 p-5 rounded-lg shadow-md" 
                  href={`/youtube/${video.id.videoId}`}>
                    <img width={450} height={250} alt={video.snippet.title} className='w-full h-auto' src={`${video.snippet.thumbnails.high.url}`} />
                    <div className='text-lg font-bold mt-2'>{video.snippet.title}</div>
                    <div className='text-sm text-gray-800'>{video.snippet.channelTitle}</div>
                  </InternalLink>
        
                  return <InternalLink key={video.id.videoId} className="flex flex-col items-center bg-slate-500 p-5 rounded-lg shadow-md"
                   href={`/youtube/playlist/${video.id.videoId}`}>
                    <img width={450} height={250} alt={video.snippet.title} className='w-full h-auto' src={`${video.snippet.thumbnails.high.url}`} />
                    <div className='text-lg font-bold mt-2'>{video.snippet.title}</div>
                    <div className='text-sm text-gray-800'>{video.snippet.channelTitle}</div>
                  </InternalLink>
            })}
              </div>
    )
}