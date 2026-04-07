"use client";
import { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useFicusChat } from "../hooks/useFicusChat";

export default function FicusAI() {
  const [inputText, setInputText] = useState("");
  const { messages, isTyping, isLoading, sendMessage, canSend } = useFicusChat();

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageToSend = inputText;
    setInputText("");
    await sendMessage(messageToSend);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 w-full mx-auto">
      <ChatMessages messages={messages} isTyping={isTyping} />
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSend={handleSendMessage}
        disabled={!canSend}
      />
    </div>
  );
}
