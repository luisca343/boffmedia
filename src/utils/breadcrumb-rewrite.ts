export function breadcrumbRewrite(parts: string[], index: number):string{
    if(index == 0) return 'smartrotom'
    
    if(parts[index-1] == 'entrada') {
        const num = parseInt(parts[index])
    }

    if(index === 4 && parts[2] === "entrada"){
        return ""
    }
    
    return parts[index].replaceAll('%20', ' ')
}
