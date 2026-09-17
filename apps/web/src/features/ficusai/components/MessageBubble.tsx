"use client";
import { Avatar, AvatarFallback } from "@/components/ui/primitives/avatar";
import { Bot, Markdown, User } from "@boffmedia/ui";
import { Mensaje, MessagePart } from "../types";
import BiomeListCard from "./BiomeListCard";
import CompletePokemonCard from "./CompletePokemonCard";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Mensaje;
  isTyping?: boolean;
}

export default function MessageBubble({ message, isTyping }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  
  const renderMessagePart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case "text":
        return (
          <Markdown key={index} className="max-w-none text-inherit">
            {(part.content as string).trim()}
          </Markdown>
        );
      
      case "biomeList":
        return (
          <BiomeListCard 
            key={index} 
            biomes={part.content as string[]} 
          />
        );
      
      case "pokemonData":
        return (
          <div key={index} className="mt-3 mb-3 mx-auto max-w-2xl w-full flex-shrink-0">
            <CompletePokemonCard 
              data={part.content as any} 
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex gap-3 max-w-[85%] mb-6",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      <Avatar className={cn(
        "w-8 h-8 flex-shrink-0",
        isUser ? "bg-primary-active" : "bg-warning"
      )}>
        <AvatarFallback className="text-white">
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm",
        isUser 
          ? "bg-primary-active text-white rounded-tr-md" 
          : "bg-layer-3 text-ink rounded-tl-md"
      )}>
        <div className="space-y-2">
          {message.parts.map((part, index) => renderMessagePart(part, index))}
        </div>
        {isTyping && !isUser && (
          <div className="flex items-center gap-1 mt-2 opacity-70">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-layer-3 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-layer-3 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-layer-3 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-ink-muted ml-2">Escribiendo...</span>
          </div>
        )}
      </div>
    </div>
  );
}
