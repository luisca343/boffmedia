import { BookLink, PageFlip } from "@/components/ui/book/book"

export function IndexPage({ book, badgePage, achievements, obtainedBadges }: { book: PageFlip, badgePage: number, achievements: any, obtainedBadges: number }){
    return (
        
        <div className="flex flex-col justify-start items-start w-full py-4 px-8">
        <BookLink book={book} page={1}  className="text-2xl hover:text-gray-700 transition-colors duration-200 font-medieval block">1. Índice</BookLink>
        <BookLink book={book} page={2}  className="text-2xl hover:text-gray-700 transition-colors duration-200 font-medieval block">2. Datos Jugador</BookLink>
        <BookLink book={book} page={3}  className="text-2xl hover:text-gray-700 transition-colors duration-200 font-medieval block">3. Equipo Actual</BookLink>
        <BookLink book={book} page={badgePage}  className="text-2xl hover:text-gray-700 transition-colors duration-200 font-medieval block">4. Medallas</BookLink>
        <div className="ml-6 flex flex-wrap">
        {
            achievements && achievements.map((achievement: any, index: number)=>{
                if(achievement.completed === 1 && achievement.category === 'Gimnasios'){
                    const page  = ++badgePage
                    return <BookLink className="mr-2" key={achievement.name} book={book} page={page}>{page}. {achievement.name}</BookLink>
                }
            }
        )
    }
    </div>
    <BookLink book={book} page={5 + obtainedBadges}  className="text-2xl hover:text-gray-700 transition-colors duration-200 font-medieval block">{5 + obtainedBadges}. Logros</BookLink>
    
    </div>
)
}