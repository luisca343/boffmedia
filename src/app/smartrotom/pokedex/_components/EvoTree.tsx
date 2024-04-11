import { rotomGET } from "@/services/boffAPI"
import { ArrowRightCircleIcon } from "lucide-react"
import getPokemonSprite from "../dexUtils"
import useTranslation from 'next-translate/useTranslation'



export async function EvoTree({params}: {params: {id: string}}){
    const evotree = await rotomGET(`/pokemon/evotree/${params.id}`)
    const { t } = useTranslation("smartrotom/pokedex/common")

    function renderTree(tree: any){
        return <div className=" h-full flex-col justify-center items-center" >
          {Object.keys(tree).map((key) => {
            if(!tree[key]) return <h1>TET</h1>
            if(!tree[key].pkm) return <h1>NO PKM</h1>

                return <div key={key} className=' flex flex-row items-center justify-center' style={{height:`${100/Object.keys(tree).length}%`}}>
                    <div className="flex flex-col justify-center items-center">
                        <h1>{t('search')}</h1>
                        <img src={getPokemonSprite(tree[key].pkm, key, false)} alt={tree[key].pkm} />
                        <span>{t(`form`, {pokemon: tree[key].pkm ,form: `${t(`form-${key}`)}`})}</span>
                    </div>
                    {tree[key].evos?.length > 0 &&<ArrowRightCircleIcon width={50}/> }
                    <div className="flex flex-col items-center">
                        {tree[key].evos?.length > 0 && tree[key].evos.map((evo: any) => {
                            return <>{renderTree(evo)}</>
                        }
                    )}
                    </div>
                </div>
        })}
        </div>
    }

    return <div>
        <h1>Arbol de evolucion {params.id}</h1>
        <div className=" bg-zinc-900 text-white">
            {renderTree(evotree)}
        </div>
    </div>
}
