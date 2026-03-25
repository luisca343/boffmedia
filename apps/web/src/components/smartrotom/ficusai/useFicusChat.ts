
"use client";
function mapDtoToMensaje(dto: any): Mensaje {
  return {
    sender: dto.sender,
    parts: Array.isArray(dto.parts)
      ? dto.parts.map((part: any) => {
          // If part is an array, convert to {type, content}
          if (Array.isArray(part)) {
            return { type: part[0], content: part[1] };
          }
          // If already an object, return as is
          return part;
        })
      : [],
  };
}
import { useState, useEffect, useMemo } from "react";
import { FicusAIService } from "@/services/api/smartrotom/ficusAiService";
import { useBoffSession } from "@/services/useBoffSession";
import { Mensaje } from "./types";

export function useFicusChat() {
  const { session } = useBoffSession();
  const uuid = useMemo(() => session?.user.smartRotomUser!.uuid, [session]);
  
  const [messages, setMessages] = useState<Mensaje[]>([
    {
      sender: "bot",
      parts: [
        {
          type: "text",
          content: "Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?",
        },
      ],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages
  useEffect(() => {
    if (!uuid) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await FicusAIService.getRecentMessages(uuid, 20);
        let dtos = response.data || [];
        let msgs = Array.isArray(dtos) ? dtos.map(mapDtoToMensaje) : [];
        if (!msgs || msgs.length === 0) {
          const firstMessage = await FicusAIService.initializeChat(uuid);
          msgs = firstMessage.data ? [mapDtoToMensaje(firstMessage.data)] : [];
        }
        setMessages(msgs);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [uuid]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !session?.user.smartRotomUser?.uuid) return;

    const userMessage: Mensaje = {
      sender: "user",
      parts: [{ type: "text", content: text }],
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await FicusAIService.sendTextMessage(session.user.smartRotomUser.uuid, text);
      const botMessage = response.data ? mapDtoToMensaje(response.data) : undefined;
      
      // Create animated message
      const animatedMessage: Mensaje = { sender: "bot", parts: [] };
      setMessages(prev => [...prev, animatedMessage]);

      // Process each part with animation
      if (botMessage) {
        for (let i = 0; i < botMessage.parts.length; i++) {
          const part = botMessage.parts[i];
          if (part.type === "text") {
            // Animate text typing
            animatedMessage.parts[i] = { type: "text", content: "" };
            const textContent = part.content as string;
            for (let j = 0; j < textContent.length; j++) {
              await new Promise(resolve => setTimeout(resolve, 20));
              animatedMessage.parts[i].content += textContent[j];
              setMessages(prev => [...prev.slice(0, -1), { ...animatedMessage }]);
            }
          } else {
            // Add non-text parts immediately
            animatedMessage.parts[i] = part;
            setMessages(prev => [...prev.slice(0, -1), { ...animatedMessage }]);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    isLoading,
    sendMessage,
    canSend: !isTyping && !isLoading && !!uuid,
  };
}
