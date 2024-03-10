"use client"
import { Input } from "@/components/ui/input";
import { rotomPOST } from "@/services/boffAPI";
import { useState } from "react";

export default function Chat() {
const [text, setText] = useState('');
const [mensajes, setMensajes] = useState(["Hola", "Adios", "Como estas?"]);

    async function enviarMensaje() {
        let msg = await rotomPOST('/chat/send', {mensaje: text})
        let msgs = [text]
        msgs.push(msg.data)
        setMensajes([...mensajes, ...msgs])
    }


  return (
    <div>
    <h1>Chat</h1>
    <ul>
        {mensajes.map((mensaje, index) => {
            return <li key={index}>{mensaje}</li>
        })}
    </ul>
      <Input  defaultValue={""} type="text" onChange={e => setText(e.target.value)}/>
      <button onClick={enviarMensaje}>Enviar</button>
    </div>
  );
}