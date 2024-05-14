
export function AccountImage({type, name, width=64, height=64}: {type: string, name: string, width?: number, height?: number}){
    return(
        <img width={width} height={width} src={getImageURL(type,name)} alt={name} className=" rounded-full"/>
    )
}


function getImageURL(type: string, name: string){
    if(type === "EMPRESA"){
        return `/smartrotom/img/apps/starbank/cuentas/${name.toLowerCase()}.png`
    } else {
        return `https://minotar.net/avatar/${name}/80.png`
    }
}