import { useBoffSession } from "@/services/useBoffSession";
import { NewsItem } from "../page";
import { rotomPOST } from "@/services/boffAPI";

export default function usePostNews(){
    const { session } = useBoffSession();

    async function postNews(news: NewsItem){
        console.log(news);
        const res = await rotomPOST(`/documents/news/${news.id}`, news);
        console.log(res);
        res.error ? console.error(res.error) : window.location.reload();
    }

    return { postNews };
}