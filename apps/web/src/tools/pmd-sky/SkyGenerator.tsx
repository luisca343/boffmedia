"use client";

import { motion } from "framer-motion";
import { useFormStore } from "./store";
import { 
  useWonderMail, 
  useSkyFormHandlers, 
  useCopyToClipboard 
} from "./_hooks";
import {
  Header,
  SkyForm,
  WonderMailDisplay
} from "./_components";

export function SkyGenerator() {
  const { formData } = useFormStore();
  const { wonderMail, generateMail, clearMail } = useWonderMail();
  const { copied, handleCopy } = useCopyToClipboard();
  const {
    handleQuestTypeChange,
    handleSubQuestChange,
    handleEuropeanVersionChange,
    handleGenerateWonderMail,
    handleItemChange,
    handleFieldChange,
  } = useSkyFormHandlers({ generateMail, clearMail });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="min-h-full text-surface-50 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div variants={itemVariants}>
          <Header />
        </motion.div>

        {/* Main Form Card */}
        <motion.div variants={itemVariants}>
          <SkyForm
            formData={formData}
            onQuestTypeChange={handleQuestTypeChange}
            onSubQuestChange={handleSubQuestChange}
            onFieldChange={handleFieldChange}
            onItemChange={handleItemChange}
            onEuropeanVersionChange={handleEuropeanVersionChange}
            onGenerateWonderMail={handleGenerateWonderMail}
          />
        </motion.div>

        {/* Wonder Mail Result */}
        {wonderMail && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <WonderMailDisplay 
              mail={wonderMail} 
              isEuropean={formData.europeanVersion}
              onCopy={() => handleCopy(wonderMail)}
              copied={copied}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
