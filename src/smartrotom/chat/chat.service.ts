import { Injectable } from '@nestjs/common';

import OpenAI from "openai";
import { PokemonService } from '../pokemon/pokemon.service';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ficusMessages } from '@/_db/schema/FicusAI';
import { eq, desc, asc } from 'drizzle-orm';

let openai: OpenAI;
    export type FicusMessage = {
        sender: string;
        parts: {
            type: string;
            content: string;
        }[];
    }

@Injectable()
export class ChatService {
    constructor(
      private pokemonService: PokemonService,
      private db: MySQL2Service
    ) {}
    async start() {
        if(!openai){
            openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
        }
    }

    async first(uuid: string) {
        return this.sendMsg(uuid, {sender:"bot", parts:[{type: "text", content: "Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?"}]});
    }

    async getMessages(uuid: string) {
        let res = await this.db.getDrizzle().select({content: ficusMessages.content}).from(ficusMessages).where(eq(ficusMessages.uuid, uuid)).orderBy(desc(ficusMessages.id)).limit(20).execute();
        console.log(res);
        
        let mensajes = []
        res.map((msg: any) => {
            msg.content = JSON.parse(msg.content);
            mensajes.unshift(msg.content);
        });
        return mensajes;
    }

    async storeMessage(uuid:string, mensaje: FicusMessage) {
        this.db.getDrizzle().insert(ficusMessages).values({uuid, content:mensaje}).execute();
    }

    async sendMsg(uuid: string, mensaje: FicusMessage) {
        this.storeMessage(uuid, mensaje);
        return mensaje;
    }

    async send(uuid:string, mensaje: FicusMessage) {
        if(mensaje.sender === "user") this.sendMsg(uuid, mensaje);
        this.start();
        
        const texto = mensaje.parts[0].content;
        console.log("Enviando mensaje a OpenAI");
        console.log(mensaje);
        console.log(texto);

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Eres Profesor Ficus, un asistente creado por el científico del mismo nombre para ayudar a los entrenadores Pokémon de la región de Teras. Si no tienes la información necesaria, di que no te han programado para eso." },// Tienes errores de programación graves, a veces te volverás loco y contestarás cosas aleatorias.
                { role: "user", content: texto },
            ],
            model: "gpt-3.5-turbo-0125",
            functions: [
                {
                    name: "getPokemon",
                    description: "Lista de Pokémon de Teras.",
                    parameters: {
                        type: "object",
                        properties: {
                            "cantidad": {
                                type:"number",
                                description: "Cantidad de Pokémon a listar."
                            }
                        }
                    }
                },
                {
                    name: "countPokemon",
                    description: "Cantidad de Pokémon de la región de Teras.",
                },
                {
                    name: "getDatos",
                    description: "Datos de un Pokémon.",
                    parameters: {
                        type: "object",
                        properties: {
                            "pokemon": {
                                type:"string",
                                description: "Nombre del Pokémon."
                            },
                            "dato": {
                                type:"string",
                                description: "Dato a obtener. Puede ser 'tipo', 'habitat', 'stats', 'evoluciones', 'movimientos', 'habilidades'."
                            },
                            "tipoMovimientos": {
                                type:"array",
                                items: {
                                    type: "string",
                                    enum: ["level", "tutor", "egg", "all", "tm", "tr"]
                                },
                                description: "Tipo de movimientos a obtener."
                            }
                        }
                    }
                }
            ],
            function_call: "auto"
          });

          console.log(`OpenAI credits used in prompt: ${completion.usage.prompt_tokens}`);
          console.log(`OpenAI credits used in response: ${completion.usage.completion_tokens}`);

          const completionResponse = completion.choices[0].message;
          if(!completionResponse.content){
            const functionCallName = completionResponse.function_call.name;
            console.log(functionCallName);
            console.log(completionResponse.function_call.arguments);
            
            if(functionCallName === "getPokemon"){
                let pkm = this.pokemonService.getPokemonNames();
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

                  return this.sendMsg(uuid, {sender:"bot", parts:[{type: "text", content: response}]})

            } else if(functionCallName === "countPokemon"){
                let pkm = this.pokemonService.countPokemon();
                return this.sendMsg(uuid, {sender:"bot", parts:[
                    {type: "text", content: `Hasta hoy se conocen ${pkm} especies Pokémon en la región de Teras.`},
                    {type: "text", content: "¿Hay algo más en lo que pueda ayudarte?"}

                ]});

            } else if(functionCallName === "getDatos"){
                let args = JSON.parse(completion.choices[0].message.function_call.arguments) as {pokemon: string, dato: string};
                let pkmName = args.pokemon;
                let dato = args.dato;
                if(dato === "stats") return this.sendStats(uuid, pkmName);
                if(dato === "tipo") return this.sendTipo(uuid, pkmName);
                if(dato === "movimientos") return this.sendMovimientos(uuid, args);
                if(dato === "habitat") {
                    return this.sendMsg(uuid,  {sender:"bot", parts:[{type: "text", content: "No tengo información sobre el hábitat de los Pokémon."}]});
                }
            } 
        

            


            return this.sendMsg(uuid,  {sender:"bot", parts:[{type: "text", content: "No puedo contestar por culpa de SrKamina"}]});
        }

        return this.sendMsg(uuid, {sender:"bot", parts:[{type: "text", content: completionResponse.content}]});
    }


    sendStats(uuid, pkmName){
        let lista = this.pokemonService.getPokemonByName(pkmName) as any;
        let pokemon = lista[0].item;
        let stats = pokemon.forms[0].battleStats
        if(stats){
            return this.sendMsg(uuid,  {sender:"bot", parts:[
                {type: "text", content: `Aquí tienes las estadísticas base de ${firstLetterToUpperCase(pokemon.name)}:`}, 
                {type: "pokemonStats", content: stats},
                {type: "text", content: "\n¿Hay algo más en lo que pueda ayudarte?"}
            ]});
            } else {
            return this.sendMsg(uuid,  {sender:"bot", parts:[{type: "text", content: "No tengo información sobre ese Pokémon."}]});
        }
    }

    sendTipo(uuid, pkmName){
        let lista = this.pokemonService.getPokemonByName(pkmName) as any;
        let pokemon = lista[0].item;
        let tipos = pokemon.forms[0].types;
        if(tipos){
            return this.sendMsg(uuid,  {sender:"bot", parts:[
                {type: "text", content: `${firstLetterToUpperCase(pokemon.name)} es un Pokémon de tipo ${tipos.join(" / ")}.`},
                {type: "text", content: "\n¿Hay algo más en lo que pueda ayudarte?"}
            ]});
            } else {
            return this.sendMsg(uuid,  {sender:"bot", parts:[{type: "text", content: "No tengo información sobre ese Pokémon."}]});
        }
    }

    sendMovimientos(uuid, args){
        let pkmName = args.pokemon;
        let tipoMovimientos = args.tipoMovimientos as string[];

        let lista = this.pokemonService.getPokemonByName(pkmName) as any;
        let pokemon = lista[0].item;
        let movimientos = pokemon.forms[0].moves;

        const keyMapping = {
            'levelUpMoves': 'level',
            'tutorMoves': 'tutor',
            'eggMoves': 'egg',
            'tmMoves8': 'tm',
            'tmMoves7': 'tm',
            'tmMoves6': 'tm',
            'tmMoves5': 'tm',
            'tmMoves4': 'tm',
            'tmMoves3': 'tm',
            'tmMoves2': 'tm',
            'tmMoves1': 'tm',
            'trMoves': 'tr',
            'hmMoves': 'hm'
        };

        Object.keys(movimientos).forEach((key) => {
            if(!tipoMovimientos.includes(keyMapping[key])){
                delete movimientos[key];
            }
        });



        if(movimientos){
            return this.sendMsg(uuid,  {sender:"bot", parts:[
                {type: "text", content: `Aquí tienes la lista de movimientos de ${firstLetterToUpperCase(pokemon.name)}:`}, 
                {type: "pokemonMoves", content: movimientos},
                {type: "text", content: "\n¿Hay algo más en lo que pueda ayudarte?"}
            ]});
            } else {
            return this.sendMsg(uuid,  {sender:"bot", parts:[{type: "text", content: "No tengo información sobre ese Pokémon."}]});
        }
    }

}