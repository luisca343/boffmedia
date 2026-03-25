import { Args } from '@pkmn/protocol'

export function handleUpdateUser(args: Args["|updateuser|"]) {
    const [, fullName, namedCode, avatar, userData] = args
    return { 
        fullName, 
        namedCode: parseInt(namedCode), 
        avatar, 
        userData: JSON.parse(userData) 
    }
}

export function handleChallstr(args: Args["|challstr|"]) {
    const [, challstr] = args
    return { challstr }
}

export function handleFormats(args: Args["|formats|"]) {
    const [, formats] = args
    return formats
}

export function handleUpdateSearch(args: Args["|updatesearch|"]) {
    const [, search] = args
    return JSON.parse(search) as {
        searching: string[];
        games: {
            [name: string]: string;
        }
    }
}
