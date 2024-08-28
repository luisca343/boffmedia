"use client"
import { Input } from "@/components/ui/input";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useState, useEffect, useRef, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { useSession } from "next-auth/react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

  type Mensaje = {
    sender: 'user' | 'bot';
    parts: { type: 'text', content: string | PokemonStats }[];
  };

  type PokemonStats = {
    name: string;
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  }

export default function FicusAI() {
    const {data: session} = useSession() as {data: BoffSession | null, status: string};
    const uuid = useMemo(() => session?.user.smartRotomUser.uuid, [session]);
    const [text, setText] = useState('');
    const [mensajes, setMensajes] = useState<Mensaje[]>([{sender:"bot", parts:[{type: "text", content: "Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?"}]}]);
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
      if(!uuid) return;
      const fetchMessages = async () => {
        if(uuid){
          let msgs = await rotomGET(`/chat/${uuid}`);
          if(msgs.length === 0){
            let mensaje = await rotomPOST('/chat/first', {uuid});
            msgs = [mensaje];
          }
          setMensajes(msgs);
        }
      };
      fetchMessages();
    }, [uuid]);

    useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "instant"});
    }
    }, [mensajes]);


  async function enviarMensaje() {
    // Add user's message to state immediately after sending
    setMensajes(prevMensajes => [...prevMensajes, { sender: 'user', parts: [{ type: 'text', content: text }]}]);
    
    // Simulate bot typing before sending a message
    setTyping(true);

    let msg = await rotomPOST('/chat/send', {uuid:session?.user.smartRotomUser.uuid, mensaje: {sender: 'user', parts: [{ type: 'text', content: text }]}});

    // Create a new message for the bot's response
    const newBotMessage: Mensaje = { sender: 'bot', parts: [] };

    // Add the new message to the state
    setMensajes(prevMensajes => [...prevMensajes, msg]);

async function processParts() {
  for (let i = 0; i < msg.parts.length; i++) {
    let part = msg.parts[i];
    if(part.type === "text"){
      await new Promise(resolve => {
        let index = 0;
        let intervalId = setInterval(() => {
          if (index < part.content.length) {
            if(!newBotMessage.parts[i]){
              newBotMessage.parts[i] = {type: "text", content: ""};
            }
            // Update the text of the new message with the current letter
            newBotMessage.parts[i].content += part.content[index];
            // Update the state with the modified messages array
            setMensajes(prevMensajes => [...prevMensajes.slice(0, -1), newBotMessage]);
            index++;
          } else {
            // Once all letters have been added, clear the interval and typing state
            clearInterval(intervalId);
            setTyping(false);
            resolve(void 0);
          }
        }, 20);
      });
    } else if(part.type === "pokemonStats"){
      newBotMessage.parts.push(part);
    } else if (part.type === "pokemonMoves"){
      newBotMessage.parts.push(part);
    }
  }
}

processParts();
  }


  
/*
  useEffect(() => {
    setTyping(false);
  }, [text]);*/

  return (
    <div className="max-w-xl mx-auto flex flex-col p-4 h-full text-lg">
      <ul className="list-none p-0  overflow-auto flex flex-col">
        {mensajes.map((mensaje, index) => {
          return (
            <MensajeChat key={index} mensaje={mensaje} sender={mensaje.sender} />
          );
        })}
        <div ref={messagesEndRef} />
      </ul>
      <div className="flex items-center mt-4">
        <Input defaultValue={""} type="text" value={text} onChange={e => setText(e.target.value)} className="mr-2" />
        <button onClick={enviarMensaje} className="bg-blue-800 text-main-50 px-4 py-2 rounded">Enviar</button>
      </div>
    </div>
  );
}



function MensajeChat({ mensaje, sender }: { mensaje: Mensaje; sender: 'user' | 'bot' }) {
  const messageClass = sender === 'user' ? 'bg-blue-800 text-main-50 self-end' : 'bg-green-800 text-main-50 self-start';

  return (
    <li
      className={`border border-zinc-950 rounded p-3 m-2 max-w-full ${messageClass} whitespace-pre-wrap`}
      style={{ maxWidth: '90%' }} // Adjust the maximum width as needed
    >
       {
        mensaje.parts.map((msg, index) => {
          if(msg.type === "text"){
            return msg.content as string;
          } else if(msg.type === "pokemonStats"){
            let stats = msg.content as PokemonStats;
            return (
              <div key='1234124'>
                <h2>{stats.name}</h2>
                <div className="flex items-center"><div className="w-2/5 mx-2">PS: {stats.hp}</div><Progress className="w-3/5 mx-2" value={stats.hp / 2.55} /></div>
                <div className="flex items-center"><div className="w-2/5 mx-2">Ataque: {stats.attack}</div><Progress className="w-3/5 mx-2" value={stats.attack / 2.55} /></div>
                <div className="flex items-center"><div className="w-2/5 mx-2">Defensa: {stats.defense}</div><Progress className="w-3/5 mx-2" value={stats.defense / 2.55} /></div>
                <div className="flex items-center"><div className="w-2/5 mx-2">At. Especial: {stats.specialAttack}</div><Progress className="w-3/5 mx-2" value={stats.specialAttack / 2.55} /></div>
                <div className="flex items-center"><div className="w-2/5 mx-2">Def. Especial: {stats.specialDefense}</div><Progress className="w-3/5 mx-2" value={stats.specialDefense / 2.55} /></div>
                <div className="flex items-center"><div className="w-2/5 mx-2">Velocidad: {stats.speed}</div><Progress className="w-3/5 mx-2" value={stats.speed / 2.55} /></div>
              </div>
            )
          }  else if(msg.type === "pokemonMoves"){
            let movimientos = msg.content as any;
            return (
              <div key='1234124'>
                {Object.keys(movimientos).map((type, index) => {
                  return (
                    <section key={index} className="mt-2">
                      <h2 className="text-xl font-bold">{type}</h2>
                      <p>
                        {movimientos[type].map((move: {level: string, attacks: string[]}, index: number) => {
                          if(type.includes('level')){
                            return `${move.level} ${move.attacks}`;
                          }
                          return move;
                        }).join(', ')}
                      </p>
                    </section>
                  )
                })}
              </div>
            )
          } else if(msg.type === "biomeList"){
            console.log(msg.content );
            let biomes = msg.content as any;
            return (
              <div key='biomes'>
                <ul>
                  {biomes.map((biome: string) => {
                    return <li key={biome}>{biome}</li>
                  })}
                </ul>
              </div>
            )
          }
        })
       }
    </li>
  );
}