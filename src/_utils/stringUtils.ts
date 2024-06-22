export function shortToLongUUID(shortUUID: string) {
    if (shortUUID.length !== 32) {
        throw new Error('Invalid short UUID length');
    }

    const parts = [
        shortUUID.substring(0, 8),
        shortUUID.substring(8, 12),
        shortUUID.substring(12, 16),
        shortUUID.substring(16, 20),
        shortUUID.substring(20, 32)
    ];

    return parts.join('-');
}

export function firstLetterToUpperCase(str: string){
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomString(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}