import { useState, useCallback } from "react";
import { generateWonderMail } from "../Generate";
import { SkyFormData } from "../store";

export function useWonderMail() {
  const [wonderMail, setWonderMail] = useState("");

  const generateMail = useCallback((formData: SkyFormData) => {
    // Check for required fields before generation
    if (formData.clientPokemon === 0) {
      console.error("Please select a client Pokémon");
      setWonderMail("");
      return;
    }
    
    const mail = generateWonderMail(formData);
    if (mail === null) {
      console.error("Failed to generate wonder mail - please check your selections");
      setWonderMail("");
      return;
    }
    const mailString = mail || "";
    setWonderMail(mailString);
  }, []);

  const clearMail = useCallback(() => {
    setWonderMail("");
  }, []);

  return { wonderMail, generateMail, clearMail };
}