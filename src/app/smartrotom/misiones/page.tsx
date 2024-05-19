import { GET } from "@/services/boffAPI"

export default async function Misiones(){
    const misiones = await GET("http://148.251.3.244:34370/quests") as any[]
    return(
        <div>
            <h1>Misiones</h1>
            <div>
                {Object.values(misiones).map((mision) => (
                    <div key={mision.id}>
                        <h2>{mision.name}</h2>
                        <p>{mision.logText}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}