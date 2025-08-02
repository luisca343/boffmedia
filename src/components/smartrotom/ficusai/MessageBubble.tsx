"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { Mensaje, MessagePart, PokemonStats } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    console.log("Rendering message part:", part);
    switch (part.type) {
      case "text":
        return (
          <div key={index} className="prose prose-invert max-w-none prose-ul:list-disc prose-ul:ml-4 prose-li:mb-1 prose-p:mb-4 prose-p:last:mb-0">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 mb-4">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>
              }}
            >
              {(part.content as string).trim()}
            </ReactMarkdown>
          </div>
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
          <CompletePokemonCard 
            key={index} 
            data={part.content as any} 
          />
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
        isUser ? "bg-primary-600" : "bg-green-600"
      )}>
        <AvatarFallback className="text-white">
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm",
        isUser 
          ? "bg-primary-600 text-white rounded-tr-md" 
          : "bg-surface-700 text-surface-100 rounded-tl-md"
      )}>
        <div className="prose prose-invert max-w-none space-y-2">
          {message.parts.map((part, index) => renderMessagePart(part, index))}
        </div>
        {isTyping && !isUser && (
          <div className="flex items-center gap-1 mt-2 opacity-70">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-surface-400 ml-2">Escribiendo...</span>
          </div>
        )}
      </div>
    </div>
  );
}