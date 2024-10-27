declare global {
    interface Window {
        mcefQuery?: (options: { request: string; onSuccess: (response: string) => void; onFailure: (error: string) => void }) => void;
    }
}

export interface QueryResult<T> {
    data?: T;
    error?: string;
    status: number;
}

export function isMinecraft(): boolean {
    return !!window.mcefQuery;
}

export async function mcefQuery<T>(query: string, data: Record<string, unknown> = {}): Promise<QueryResult<T>> {
    if (!isMinecraft()) {
        return { error: 'mcefQuery not available', status: 500 };
    }
    const datos = { query, ...data };
    return new Promise<QueryResult<T>>((resolve) => {
        try {
            window.mcefQuery!({
                request: JSON.stringify(datos),
                onSuccess: (response: string) => {
                    try {
                        const parsedResponse = JSON.parse(response) as T;
                        resolve({ data: parsedResponse, status: 200 });
                    } catch (error) {
                        console.error('Error parsing response:', error);
                        resolve({ error: 'Error parsing response: ' + error, status: 500 });
                    }
                },
                onFailure: (error: string) => {
                    console.error('Query failed:', error);
                    resolve({ error, status: 400 });
                }
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            resolve({ error: error instanceof Error ? error.message : 'Unknown error', status: 500 });
        }
    });
}