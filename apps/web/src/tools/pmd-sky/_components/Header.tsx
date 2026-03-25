import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations("");
  
  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-cyan-400 to-secondary-600 drop-shadow-lg">
          ✨ {t("WONDER_MAIL_CREATOR")} ✨
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-secondary-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
      </motion.div>
    </div>
  );
}
