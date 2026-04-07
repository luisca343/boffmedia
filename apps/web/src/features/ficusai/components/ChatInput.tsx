"use client";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Send, Bot } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-surface-900/50 backdrop-blur-sm border-t border-surface-700">
      <div className="flex-1 relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje aquí..."
          disabled={disabled}
          className="pr-4 bg-surface-800 border-surface-600 text-surface-100 placeholder:text-surface-400 focus:border-primary-500 focus:ring-primary-500/20"
        />
      </div>
      <Button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        size="icon"
        className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg transition-all duration-200 hover:shadow-primary-500/25"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
