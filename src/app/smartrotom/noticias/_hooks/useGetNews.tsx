import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";


export type News = {
    id: number;
    title: string;
    subtitle: string;
    subcategory: string;
    public: number;
    content: string;
    buttonText: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

export function useGetNews(): News[] {
  const [news, setNews] = useState([]);

  useEffect(() => {
    rotomGET("/documents/news").then((res) => {
      setNews(res);
    });
  }, []);

  return news;
}
