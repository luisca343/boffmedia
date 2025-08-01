"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { Mensaje, MessagePart, PokemonStats } from "./types";
import PokemonStatsCard from "./PokemonStatsCard";
import PokemonMovesCard from "./PokemonMovesCard";
import BiomeListCard from "./BiomeListCard";
import PokemonTypesCard from "./PokemonTypesCard";
import PokemonHabitatCard from "./PokemonHabitatCard";
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
          <div key={index} className="whitespace-pre-wrap">
            {part.content as string}
          </div>
        );
      
      case "pokemonStats":
        return (
          <PokemonStatsCard 
            key={index} 
            data={part.content as { stats: PokemonStats; pokemonName: string }} 
          />
        );
      
      case "pokemonMoves":
        return (
          <PokemonMovesCard 
            key={index} 
            data={part.content as { moves: Record<string, any>; pokemonName: string }} 
          />
        );
      
      case "biomeList":
        return (
          <BiomeListCard 
            key={index} 
            biomes={part.content as string[]} 
          />
        );
      
      case "pokemonTypes":
        return (
          <PokemonTypesCard 
            key={index} 
            data={part.content as { types: string[]; pokemonName: string }} 
          />
        );
      
      case "pokemonHabitat":
        return (
          <PokemonHabitatCard 
            key={index} 
            data={part.content as { habitat: string[]; pokemonName: string }} 
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
        <div className="space-y-2">
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
