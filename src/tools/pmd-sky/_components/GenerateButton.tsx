import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HiMail, HiSparkles } from "react-icons/hi";
import { useTranslations } from "next-intl";

interface GenerateButtonProps {
  onClick: () => void;
}

export function GenerateButton({ onClick }: GenerateButtonProps) {
  const t = useTranslations("");
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        onClick={onClick}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg py-6"
      >
        <HiMail className="w-5 h-5 mr-2" />
        {t("GENERATE_WONDER_MAIL")}
        <HiSparkles className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );
}
