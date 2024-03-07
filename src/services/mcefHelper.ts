export function isMinecraft() {
    return 'mcefQuery' in window && typeof window.mcefQuery === 'function';
}

export async function getDatosUsuario(){
    const response = await mcefQuery('getUserData');
    return response;
}

export async function mcefQuery(query: string, data: Object = {}){
    let datos = {query}
    if (data) {
        datos = {...datos, ...data}
    }
    return new Promise((resolve, reject) => {
        try{
            // @ts-ignore
            window.mcefQuery({
                request: JSON.stringify(datos),
                onSuccess: (response: string) => {
                    let parsedResponse;
                    try {
                        parsedResponse = JSON.parse(response);
                    } catch (error) {
                        reject('Error parsing response: ' + error);
                    }
                    resolve(parsedResponse);
                },
                onFailure: (error: string) => {
                    reject(error);
                }
            });
        } catch (error) {
            
        }
    });
}