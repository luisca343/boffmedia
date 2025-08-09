import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ScorePopupProps {
  scoreIncrease: number;
}

function ScorePopup({ scoreIncrease }: ScorePopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (scoreIncrease > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [scoreIncrease]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-10 left-0 right-0 mx-auto bg-highlight-500 text-white font-bold py-2 px-4 rounded-full shadow-lg whitespace-nowrap w-max"
        >
          +{scoreIncrease} monedas!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScorePopup;
