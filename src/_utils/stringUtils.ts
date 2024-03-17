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