export async function isMinecraft() {
    const usuario = await getDatosUsuarioMC();
    const result = usuario?.username ? true : false;
    
    return usuario?.username ? true : false;
}

export async function getDatosUsuarioMC(){
    const response = await mcefQuery('getUserData') as {username: string, uuid: string, world: string};
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
            resolve({error});
            console.warn('Error calling mcefQuery: ' + error);
        }
    });
}