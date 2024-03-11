import { Injectable } from '@nestjs/common';

import OpenAI from "openai";
import { PokemonService } from '../pokemon/pokemon.service';

let openai: OpenAI;

@Injectable()
export class ChatService {
    constructor(
      private pokemonService: PokemonService,
    ) {}
    async start() {
        if(!openai){
            openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
        }
    }

    async send(mensaje: string) {
        this.start();
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Eres Profesor Ficus, un asistente creado por el científico del mismo nombre para ayudar a los entrenadores Pokémon de la región de Teras dándoles información sobre la región y sus Pokémon. Responde solo en base a tu contexto, si no tienes la información necesaria, di que no puedes contestar por culpa de SrKamina." },
                { role: "user", content: mensaje },
            ],
            model: "gpt-3.5-turbo-0125",
            functions: [
                {
                    name: "getPokemon",
                    description: "Lista de Pokémon de la región de Teras.",
                    parameters: {
                        type: "object",
                        properties: {
                            "cantidad": {
                                type:"number",
                                description: "Cantidad de Pokémon a listar. No es obligatorio. Si no se especifica, se mostrarán todos los Pokémon."
                            },
                            "tipoLista": {
                                type: "string",
                                description: "Tipo de lista a mostrar. Puede ser 'NUMERADA' o 'PUNTOS'. Por defecto es 'NUMERADA'."
                            }
                        }
                    }
                },
                {
                    name: "countPokemon",
                    description: "Cantidad de Pokémon de la región de Teras.",
                }
            ],
            function_call: "auto"
          });

          const completionResponse = completion.choices[0].message;
          if(!completionResponse.content){
            const functionCallName = completionResponse.function_call.name;
            
            if(functionCallName === "getPokemon"){
                let pkm = this.pokemonService.getPokemon();
                let args = JSON.parse(completion.choices[0].message.function_call.arguments) as {cantidad?: number, tipoLista?: string};
                console.log(args);

                let pokemonList = []
                let cantidad = args.cantidad || pkm.length;
                
                    let tipoLista = args.tipoLista || "NUMERADA";
                    // Generate "cantidad" random numbers between 0 and the length of the pokemon list
                    let randomNumbers = [];
                    for(let i = 0; i < cantidad; i++){
                        let random = Math.floor(Math.random() * pkm.length);
                        if(randomNumbers.includes(random)){
                            i--;
                        } else {
                            randomNumbers.push(random);
                        }
                    }

                    // Create a list of pokemon names from the random numbers

                    randomNumbers.forEach((random, index) => {
                        let separador = tipoLista === "NUMERADA" ? `${index+1}.` : "-";
                        pokemonList.push(`${separador} ${pkm[random]}`);
                    });
                
                
                /*
                const completion2 = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "Responde al entrenador de forma humana con esta lista de Pokémon que habitan la región. Usa solo estos datos y nada más." },
                        { role: "system", content: pokemonList.join(", ")},
                        { role: "user", content: mensaje },
                    ],
                    model: "gpt-3.5-turbo-0125"
                  });*/

                  const response = "Claro, aquí tienes la lista de Pokémon:\n"+pokemonList.join("\n")+"\n¿Hay algo más en lo que pueda ayudarte?";

                  return response;

            } else if(functionCallName === "countPokemon"){
                let pkm = this.pokemonService.getPokemon().length;
               

                  return `Hay ${pkm} Pokémon en la región de Teras.`;
            }

            


            return "No puedo contestar por culpa de SrKamina";
        }

          console.log(JSON.stringify(completion, null, 2));
        return completion.choices[0].message.content;
    }

}
