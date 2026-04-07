import { useCallback } from "react";
import { useFormStore } from "../store";
import { getForceClient } from "../QuestData";
import { SkyFormData } from "../store";

interface UseSkyFormHandlersProps {
  generateMail: (formData: SkyFormData) => void;
  clearMail: () => void;
}

export function useSkyFormHandlers({ generateMail, clearMail }: UseSkyFormHandlersProps) {
  const { formData, setFormData } = useFormStore();

  const handleItemChange = useCallback(
    (field: 'targetItem' | 'rewardItem') => (value: string) => {
      setFormData({ [field]: Number(value) });
    },
    [setFormData]
  );

  const handleQuestTypeChange = useCallback((value: string) => {
    const questType = Number(value);
    setFormData({
      questType,
      forceClient: getForceClient(questType, formData.specialQuestType),
      forceTarget: getForceClient(questType, formData.specialQuestType),
    });
  }, [setFormData, formData.specialQuestType]);

  const handleSubQuestChange = useCallback((value: string) => {
    const specialQuestType = Number(value);
    setFormData({
      specialQuestType,
      forceClient: getForceClient(formData.questType, specialQuestType),
      forceTarget: getForceClient(formData.questType, specialQuestType),
    });
  }, [setFormData, formData.questType]);

  const handleEuropeanVersionChange = useCallback((value: string | boolean) => {
    setFormData({ europeanVersion: value === true });
    clearMail();
  }, [setFormData, clearMail]);

  const handleGenerateWonderMail = useCallback(() => {
    generateMail(formData);
  }, [generateMail, formData]);

  const handleFieldChange = useCallback((field: string) => (value: string | number) => {
    setFormData({ [field]: typeof value === 'string' ? Number(value) : value });
  }, [setFormData]);

  return {
    handleItemChange,
    handleQuestTypeChange,
    handleSubQuestChange,
    handleEuropeanVersionChange,
    handleGenerateWonderMail,
    handleFieldChange,
  };
}
