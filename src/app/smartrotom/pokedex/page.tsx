import MenuHeader from "./_components/MenuHeader";
import { InternalLink } from "@/components/nav/Link";
import { LastRegistries } from "./_components/LastRegistries";
import { PokedexSection } from "./_components/PokedexSection";
import PokemonSearchBar from "./_components/PokemonSearchBar";
import { PossibleSpawns } from "./_components/PossibleSpawns";
import { ChevronRightIcon, BookOpenIcon, MapIcon, BoltIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function PokedexMenu(){
    return (
        <div className="bg-surface-800 min-h-full overflow-auto">
            <MenuHeader />
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                <PokedexSection title="Búsqueda Rápida">
                    <PokemonSearchBar />
                </PokedexSection>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
                    <QuickAccessCard 
                        title="Explorar Pokédex" 
                        description="Visualiza todos los Pokémon registrados"
                        href="/pokedex/entrada"
                        icon={<BookOpenIcon className="h-6 w-6" />}
                    />
                    <QuickAccessCard 
                        title="Localización" 
                        description="Encuentra Pokémon por bioma"
                        href="/pokedex/localizacion"
                        icon={<MapIcon className="h-6 w-6" />}
                    />
                    <QuickAccessCard 
                        title="Movimientos" 
                        description="Consulta los movimientos Pokémon"
                        href="/pokedex/movimientos"
                        icon={<BoltIcon className="h-6 w-6" />}
                    />
                    <QuickAccessCard 
                        title="Habilidades" 
                        description="Explora las habilidades Pokémon"
                        href="/pokedex/habilidades"
                        icon={<SparklesIcon className="h-6 w-6" />}
                    />
                    <QuickAccessCard 
                        title="Tipos" 
                        description="Explora las ventajas y desventajas de tipos"
                        href="/pokedex/tipos"
                        icon={<div className="h-6 w-6 flex items-center justify-center">
                            <img src="/smartrotom/img/types/dragon.png" alt="Tipos" className="h-5 w-5" />
                        </div>}
                    />
                    {/* Empty div for proper grid alignment on large screens when there's an odd number of cards */}
                    <div className="hidden xl:block"></div>
                </div>
                
                <PokedexSection title="Últimos Registros" btn={
                    <span className="text-primary-400 hover:text-primary-300 text-sm font-normal">Ver historial completo</span>
                }>
                    <div className="bg-surface-700/30 p-3 rounded-lg">
                        <LastRegistries />
                    </div>
                </PokedexSection>
                
                <PokedexSection title="Posibles Spawns" btn={
                    <InternalLink href="/pokedex/spawns" className="text-primary-400 hover:text-primary-300 text-sm font-normal">
                        Ver más
                    </InternalLink>
                }>
                    <div className="bg-surface-700/30 p-3 rounded-lg">
                        <PossibleSpawns pokemonSpawns={[]} hideCaught={false} hideSeen={false}/>
                    </div>
                </PokedexSection>
            </div>
        </div>
    )
}

function QuickAccessCard({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) {
    return (
        <InternalLink href={href} className="block">
            <div className="bg-surface-700/50 border border-surface-600 rounded-lg p-4 hover:bg-surface-600 transition-all shadow-md hover:shadow-lg flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-surface-800 p-2 rounded-full mr-4">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-surface-100">{title}</h3>
                        <p className="text-surface-300 text-sm">{description}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-surface-400" />
            </div>
        </InternalLink>
    );
}