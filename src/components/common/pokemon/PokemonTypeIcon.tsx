export const colors = {
    normal: { backgroundColor: "#9fa19f", textColor: "black" },
    fire: { backgroundColor: "#e62829", textColor: "white" },
    water: { backgroundColor: "#2980ef", textColor: "white" },
    grass: { backgroundColor: "#3fa129", textColor: "white" },
    electric: { backgroundColor: "#fac000", textColor: "black" },
    ice: { backgroundColor: "#3fd8ff", textColor: "white" },
    fighting: { backgroundColor: "#ff8000", textColor: "white" },
    poison: { backgroundColor: "#9141cb", textColor: "white" },
    ground: { backgroundColor: "#915121", textColor: "black" },
    flying: { backgroundColor: "#81b9ef", textColor: "white" },
    psychic: { backgroundColor: "#ef4179", textColor: "white" },
    bug: { backgroundColor: "#91a119", textColor: "white" },
    rock: { backgroundColor: "#afa981", textColor: "black" },
    ghost: { backgroundColor: "#704170", textColor: "white" },
    dragon: { backgroundColor: "#5061e1", textColor: "white" },
    dark: { backgroundColor: "#50413f", textColor: "white" },
    steel: { backgroundColor: "#60a1b8", textColor: "white" },
    fairy: { backgroundColor: "#ef71ef", textColor: "white" },
    
    physical: { backgroundColor: "#ff4400", textColor: "white" },
    special: { backgroundColor: "#2266cc", textColor: "white" },
    status: { backgroundColor: "#999999", textColor: "black" },
} as {[key: string]: {backgroundColor: string, textColor: string}}


export function PokemonTypeIcon({ type, size = 48 }: { type: string, size?: number }) {
  const color = colors[type.toLowerCase()]?.backgroundColor || '#9fa19f';
  return (
    <div key={type} className="relative flex items-center justify-center">
      <div style={{backgroundColor: color, borderColor: color, width: size, height: size}} className="rounded-full border-2 flex items-center justify-center shadow">
        <img src={`/smartrotom/img/types/${type}.png`} alt={type} className={`w-full h-full`} />
      </div>
    </div>
  );
}