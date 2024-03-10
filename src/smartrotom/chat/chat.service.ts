import { Injectable } from '@nestjs/common';

import OpenAI from "openai";

let openai: OpenAI;

@Injectable()
export class ChatService {
    async start() {
        if(!openai){
            openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
        }
    }

    async send(mensaje: string) {
        this.start();
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: mensaje },
            ],
            model: "gpt-3.5-turbo",
          });

        return completion.choices[0].message.content;
    }
}
