"use client"
import { Input } from "@/components/ui/input";
import { rotomPOST } from "@/services/boffAPI";
import { useState, useEffect } from "react";

export default function Chat() {
  const [text, setText] = useState('');
  const [mensajes, setMensajes] = useState([{ sender: "bot", text: "Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?" }]);
  const [typing, setTyping] = useState(false);

  async function enviarMensaje() {
    // Add user's message to state immediately after sending
    setMensajes(prevMensajes => [...prevMensajes, { text, sender: 'user' }]);
    
    // Simulate bot typing before sending a message
    setTyping(true);

    let msg = await rotomPOST('/chat/send', { mensaje: text });

    // Create a new message for the bot's response
    const newBotMessage = { sender: 'bot', text: '' };

    // Add the new message to the state
    setMensajes(prevMensajes => [...prevMensajes, newBotMessage]);

    // Initialize an index to track the current letter
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
    }, 20);
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
            <li
              key={index}
              className={`rounded p-2 mb-2 max-w-full ${messageClass} whitespace-pre-wrap`}
              style={{ maxWidth: '70%' }} // Adjust the maximum width as needed
            >
              {mensaje.text}
            </li>
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
