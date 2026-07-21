"use client"
import { AlertTriangle, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useTranslations } from "next-intl"

export interface RotomErrorHelp {
  possibleCauses: string[];
  solutions: string[];
}

export interface RotomErrorProps {
  error?: string;
  title?: string;
  help?: RotomErrorHelp;
  onAction?: () => void;
  actionText?: string;
  showHelp?: boolean;
}

export function RotomErrorPage(props: RotomErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary-hover text-primary-active font-mono">
      <RotomError {...props} />
    </div>
  )
}

export function RotomError({
  error,
  title,
  help,
  onAction,
  actionText,
  showHelp: initialShowHelp = false,
}: RotomErrorProps) {
  const t = useTranslations("smartrotom.error")
  const [showHelp, setShowHelp] = useState(initialShowHelp);

  const resolvedTitle = title ?? t("detected")
  const resolvedActionText = actionText ?? t("retry")

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary-soft p-8 rounded-lg shadow-lg border-2 border-primary max-w-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="w-8 h-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">{resolvedTitle}</h1>
        </div>
        {help && (
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-primary-active hover:text-primary-active"
            title={t("showHelp")}
          >
            <HelpCircle size={20} />
          </button>
        )}
      </div>

      <div className="bg-primary-soft p-4 rounded mb-4">
        <p className="text-sm">{error || t("unknown")}</p>
      </div>

      {showHelp && help && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="bg-primary-soft p-4 rounded border border-primary">
            <h3 className="font-bold mb-2">{t("possibleCauses")}</h3>
            <ul className="list-disc pl-5 text-sm mb-3">
              {help.possibleCauses.map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>

            <h3 className="font-bold mb-2">{t("solutions")}</h3>
            <ul className="list-disc pl-5 text-sm">
              {help.solutions.map((solution, i) => (
                <li key={i}>{solution}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {onAction && (
        <div className="mt-4 text-center">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-active transition-colors"
          >
            {resolvedActionText}
          </button>
        </div>
      )}
    </motion.div>
  )
}
