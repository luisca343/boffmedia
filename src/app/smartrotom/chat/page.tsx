"use client"
import { Input } from "@/components/ui/input";
import { rotomPOST } from "@/services/boffAPI";
import { useState, useEffect } from "react";

  type Mensaje = {
    sender: 'user' | 'bot';
    parts: { type: 'text', content: string }[];
  };

export default function Chat() {
    const [text, setText] = useState('');
    const [mensajes, setMensajes] = useState<Mensaje[]>([{sender:"bot", parts:[{type: "text", content: "Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?"}]}]);
    const [typing, setTyping] = useState(false);



  async function enviarMensaje() {
    // Add user's message to state immediately after sending
    setMensajes(prevMensajes => [...prevMensajes, { sender: 'user', parts: [{ type: 'text', content: text }]}]);
    
    // Simulate bot typing before sending a message
    setTyping(true);

    let msg = await rotomPOST('/chat/send', { mensaje: text });

    // Create a new message for the bot's response
    //const newBotMessage: Mensaje = { sender: 'bot', parts: [{ type: 'text', content: '' }] };

    // Add the new message to the state
    setMensajes(prevMensajes => [...prevMensajes, msg]);

    // Initialize an index to track the current letter
    /*
    let index = 0;

    // Use setInterval to add one letter to the response every 100ms
    let intervalId = setInterval(() => {
      if (index < msg.data.length) {
        // Update the text of the new message with the current letter
        newBotMessage.text += msg.data[index];
        // Update the state with the modified messages array
        setMensajes(prevMensajes => [...prevMensajes.slice(0, -1), newBotMessage]);
        index++;
      } else {
        // Once all letters have been added, clear the interval and typing state
        clearInterval(intervalId);
        setTyping(false);
      }
    }, 20);*/
  }

  useEffect(() => {
    // Clear the current message when the user types a new message
    setTyping(false);
  }, [text]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <ul className="list-none p-0">
        {mensajes.map((mensaje, index) => {
          // Apply different styles based on the sender
          const messageClass = mensaje.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-green-500 text-white self-start';

          return (
            <MensajeChat key={index} mensaje={mensaje} sender={mensaje.sender} />
          );
        })}
      </ul>
      <div className="flex items-center mt-4">
        <Input defaultValue={""} type="text" onChange={e => setText(e.target.value)} className="mr-2" />
        <button onClick={enviarMensaje} className="bg-blue-500 text-white px-4 py-2 rounded">Enviar</button>
      </div>
    </div>
  );
}



function MensajeChat({ mensaje, sender }: { mensaje: Mensaje; sender: 'user' | 'bot' }) {
  const messageClass = sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-green-500 text-white self-start';

  return (
    <li
      className={`rounded p-2 mb-2 max-w-full ${messageClass} whitespace-pre-wrap`}
      style={{ maxWidth: '70%' }} // Adjust the maximum width as needed
    >
       {
        mensaje.parts.map((msg, index) => {
          if(msg.type === "text"){
            return msg.content;
          } else if(msg.type === "pokemonStats"){
            let stats = msg.content
            return (
              <div key='1234124'>
                <h2>{stats.name}</h2>
                <p>HP: {stats.hp}</p>
                <p>Attack: {stats.attack}</p>
                <p>Defense: {stats.defense}</p>
                <p>Sp. Atk: {stats.specialAttack}</p>
                <p>Sp. Def: {stats.specialDefense}</p>
                <p>Speed: {stats.speed}</p>
              </div>
            )
          }
        })
       }
    </li>
  );
}