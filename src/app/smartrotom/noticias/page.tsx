import { InternalLink } from "@/components/nav/Link";
import { BottomNews, MainNews, SideNews, SideNewsWithPicture } from "./_components/NewsPreview";

export interface News {
    id: number
    title: string
    subtitle: string
    image?: string
    date?: string
}

const news = [
    {
        id: 1,
        title: "Putin warns South Korea against arming Ukraine",
        subtitle: "The Russian president said it would be a big mistake if Seoul sent lethal weapons to Kyiv.",
        image: `https://ichef.bbci.co.uk/news/480/cpsprodpb/1470/live/8b703570-2f84-11ef-a1a0-1b597702763c.jpg.webp`,
        date: "Hoy | Pueblo Mizu"
    },
    {
        id: 2,
        title: "North Korea building border ‘wall’, satellite images reveal",
        subtitle: "North Korea is building sections of what appears to be a wall in several places near its border with South Korea, new satellite images show",
        image: `https://ichef.bbci.co.uk/news/480/cpsprodpb/6c2f/live/232f9d80-2f10-11ef-90be-b75b34b0bbb2.png.webp`
    },
    {
        id: 3,
        title: "Rayner pressed on Labour NHS plans, Corbyn and two-child benefit cap",
        subtitle: "Angela Rayner is questioned about her party`s NHS funding plans which include an increase to staffing.",
        image: `https://ichef.bbci.co.uk/ace/standard/480/cpsprodpb/8802/live/678b3d30-2fb1-11ef-bdc5-41d7421c2adf.png.webp`
    },
    {
        id: 4,
        title: "Ex-footballer Roberto Baggio injured in armed robbery",
        subtitle: "The veteran footballer received stitches to his head after an armed robbery at his villa in northern Italy.",
        image: `https://ichef.bbci.co.uk/news/480/cpsprodpb/5c30/live/cebbe900-2fa7-11ef-acc1-b3f164ccdd74.jpg.webp`
    },
    {
        id: 5,
        title: "Pope told off by student for using anti-LGBTQ language",
        subtitle: "It comes after reports that the Pope used extremely offensive language against  gay men in a meeting.",
        image: `https://ichef.bbci.co.uk/news/480/cpsprodpb/23ad/live/1c1ed430-2fa0-11ef-9552-ddad3d31dcba.jpg.webp`
    },
    {
        id: 6,
        title: "Egyptian pilgrims `totally abandoned` in Hajj heat",
        subtitle: "With hundreds thought dead, one victim`s family say unregistered pilgrims have been failed by travel agents.",
        image: `https://ichef.bbci.co.uk/news/480/cpsprodpb/e8b2/live/e73e0120-2f34-11ef-af74-49a581acd12a.jpg.webp`
    },
    {
        id: 7,
        title: "Macron`s hometown voters look set to shun the president",
        subtitle: "Residents of Mr Macron`s hometown have turned their back on him ahead of France`s snap elections."
    },
    {
        id: 8,
        title: "NZ woman sues partner for not taking her to airport",
        subtitle: "New Zealand`s Disputes Tribunal dismissed the claim, saying the promises did not constitute a contract"
    }
] as News[]


export default function NoticieroFurretToday(){
    return (
        <div>
            <nav className="h-12 bg-pink-600 flex items-center">
                LOGO AQUÍ SUPONGO
                <InternalLink href="/noticias/ordenar">Ordenar</InternalLink>
                <InternalLink href="/noticias/editar">Editar</InternalLink>
            </nav>
            <div className="w-[75%] m-auto text-4xl font-bold mt-4 border-b-2 border-pink-600">HOY</div>
            <div className="flex w-[75%] m-auto">
                <div className="flex w-[80%] flex-col border-b border-gray-200 p-2">
                    <MainNews news={news[0]} />
                    <div className="w-full flex justify-between   p-2">
                        <BottomNews news={news[1]} />
                        <BottomNews news={news[2]} />
                        <BottomNews news={news[3]} />
                        <BottomNews news={news[4]} />
                    </div>
                </div>
                <div className="w-[25%]  p-2 border-b border-gray-200 ">
                    <SideNewsWithPicture news={news[5]} />
                    <SideNews news={news[6]} />
                    <SideNews news={news[7]} />
                </div>
            </div>
        </div>
    )
}