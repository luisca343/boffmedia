import { BottomNews, MainNews, SideNews, SideNewsWithPicture } from "./_components/NewsPreview";
import { rotomGET } from "@/services/boffAPI";
import FurretNav from "./_components/FurretNav";

export interface News {
    id: number
    newsId: number
    title: string
    subtitle: string
    image?: string
    date?: string
}

export default async function NoticieroFurretToday(){
    const news = await rotomGET("/documents/activeNews") as News[]
    const allNews = await rotomGET("/documents/news") as News[]

    return (
        <div className="bg-pink-200 text-black lexend-mega">
            <FurretNav />
            <div className="w-[90%]  m-auto text-2xl lg:text-4xl font-bold mt-4 border-b-4 border-black">PORTADA</div>
            <section className="flex flex-col lg:flex-row w-[90%]  m-auto mt-4 justify-center  lg:justify-around">
                    <div className="w-full lg:w-[50%] aspect-[5/4]">
                        <MainNews news={news[0]} slot={1}/>
                    </div>
                    <div className="flex flex-col justify-around mt-4 lg:mt-0">
                        {news.slice(1, 5).map((item, index) => (
                            <SideNewsWithPicture key={item.id} news={item} slot={index + 2} />
                        ))}
                    </div>
            </section>
            { allNews.length > 5 && <section>
                    <div className="w-[90%]  m-auto text-xl lg:text-2xl font-bold mt-4 border-b-4 border-black">OTRAS NOTICIAS</div>
                        <div className="w-[90%]  m-auto flex flex-col lg:flex-row my-4 justify-around flex-wrap">
                        {
                            allNews.map((current, i) => {
                                if (!news.some(n => n.newsId === current.id)) {
                                    return <BottomNews news={current} slot={i} key={i} />;
                                }
                            })
                        }
                    </div>
                </section>
            }
        </div>
    )
}