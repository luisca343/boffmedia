"use client";
import { useEffect, useRef } from "react";
import { Mensaje } from "../types";
import MessageBubble from "./MessageBubble";

interface ChatMessagesProps {
  messages: Mensaje[];
  isTyping: boolean;
}

export default function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            isTyping={isTyping && index === messages.length - 1 && message.sender === "bot"}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
