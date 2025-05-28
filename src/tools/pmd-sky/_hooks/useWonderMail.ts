import { useState, useCallback } from "react";
import { generateWonderMail } from "../Generate";
import { SkyFormData } from "../store";

export function useWonderMail() {
  const [wonderMail, setWonderMail] = useState("");

  const generateMail = useCallback((formData: SkyFormData) => {
    const mail = generateWonderMail(formData) || "";
    setWonderMail(mail);
  }, []);

  const clearMail = useCallback(() => {
    setWonderMail("");
  }, []);

  return { wonderMail, generateMail, clearMail };
}