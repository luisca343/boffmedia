import  Axios  from "axios"
import Image from "next/image"


interface Video {
  id: {
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

export default async function YoutubePage() {
  let busqueda = ""
  const videos = await Axios.get(`https://www.googleapis.com/youtube/v3/search?key=AIzaSyAZ2J63sHYEtl_kRmL69Wka0isKJG4mj2g&part=snippet&q=${busqueda}&maxResults=25&type=video`)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-800">
      {videos.data.items.map((video: Video) => (
        <div key={video.id.videoId} className="flex flex-col items-center bg-slate-100 p-5 rounded-lg shadow-md">
          <Image width={450} height={250} alt={video.snippet.title} className='w-full h-auto' src={`${video.snippet.thumbnails.high.url}`} />
          <div className='text-lg font-bold mt-2'>{video.snippet.title}</div>
          <div className='text-sm text-gray-800'>{video.snippet.channelTitle}</div>
        </div>
      ))}
    </div>
  )
}