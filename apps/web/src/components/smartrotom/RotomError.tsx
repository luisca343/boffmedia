"use client"
import { AlertTriangle, HelpCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { 
  ROTOM_ERROR_CODES, 
  RotomErrorCodeKey, 
  getFormattedErrorCode, 
  logErrorToMonitoring,
  ROTOM_ERROR_DOCS,
  ERROR_SEVERITIES,
  ErrorSeverity
} from "./RotomErrorSystem"

interface EnhancedErrorProps {
  errorCode: RotomErrorCodeKey;
  context?: Record<string, any>;
  onAction?: () => void;
  actionText?: string;
  showHelp?: boolean;
}

interface LegacyErrorProps {
  error?: string;
}

type RotomErrorProps = EnhancedErrorProps | LegacyErrorProps;
function isEnhancedErrorProps(props: RotomErrorProps): props is EnhancedErrorProps {
  return (props as EnhancedErrorProps).errorCode !== undefined;
}

export function RotomErrorPage(props: RotomErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-mono">
      <RotomError {...props} />
    </div>
  )
}

export function RotomError(props: RotomErrorProps) {
  // Always call hooks at the top level
  const [showHelp, setShowHelp] = useState(false);

  // For EnhancedErrorProps
  let errorCode, context, onAction, actionText, initialShowHelp, errorDef, formattedCode, errorDocs;
  if (isEnhancedErrorProps(props)) {
    errorCode = props.errorCode;
    context = props.context ?? {};
    onAction = props.onAction;
    actionText = props.actionText ?? "Reintentar";
    initialShowHelp = props.showHelp ?? false;
    errorDef = ROTOM_ERROR_CODES[errorCode];
    formattedCode = getFormattedErrorCode(errorCode);
    errorDocs = errorCode in ROTOM_ERROR_DOCS ? ROTOM_ERROR_DOCS[errorCode] : undefined;
  }

  useEffect(() => {
    if (isEnhancedErrorProps(props)) {
      logErrorToMonitoring(props.errorCode, props.context ?? {});
    }
     
  }, [isEnhancedErrorProps(props) ? props.errorCode : undefined, isEnhancedErrorProps(props) ? props.context : undefined]);

  useEffect(() => {
    if (isEnhancedErrorProps(props)) {
      setShowHelp(props.showHelp ?? false);
    }
     
  }, [isEnhancedErrorProps(props) ? props.showHelp : undefined]);

  if (!isEnhancedErrorProps(props)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300"
      >
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold">Error Detectado</h1>
        </div>
        <div className="bg-primary-300 p-4 rounded">
          <p className="text-sm">{props.error || "Error desconocido"}</p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-primary-700">
            SmartRotom Error Code: <span className="font-bold">SR-000-000</span>
          </p>
        </div>
      </motion.div>
    );
  }

  // Fallback if errorDef is undefined
  if (!errorDef) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300 max-w-md"
      >
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold">Error desconocido</h1>
        </div>
        <div className="bg-primary-300 p-4 rounded mb-4">
          <p className="text-sm">No se encontró información para el código de error proporcionado.</p>
        </div>
      </motion.div>
    );
  }

  const getSeverityIcon = (severity: ErrorSeverity) => {
    if (severity === ERROR_SEVERITIES.ERROR) {
      return <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />;
    } else if (severity === ERROR_SEVERITIES.WARNING) {
      return <AlertCircle className="w-8 h-8 text-amber-500 mr-2" />;
    } else if (severity === ERROR_SEVERITIES.INFO) {
      return <AlertCircle className="w-8 h-8 text-secondary-500 mr-2" />;
    } else {
      return <AlertTriangle className="w-8 h-8 text-primary-500 mr-2" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300 max-w-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getSeverityIcon(errorDef.severity)}
          <h1 className="text-2xl font-bold">Error {errorDef.domain}</h1>
        </div>
        {errorDocs && (
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-primary-600 hover:text-primary-800"
            title="Mostrar ayuda"
          >
            <HelpCircle size={20} />
          </button>
        )}
      </div>
      
      <div className="bg-primary-300 p-4 rounded mb-4">
        <p className="text-sm">{errorDef.message}</p>
      </div>
      
      {showHelp && errorDocs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="bg-primary-100 p-4 rounded border border-primary-300">
            <h3 className="font-bold mb-2">Posibles causas:</h3>
            <ul className="list-disc pl-5 text-sm mb-3">
              {errorDocs.possibleCauses.map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
            
            <h3 className="font-bold mb-2">Soluciones:</h3>
            <ul className="list-disc pl-5 text-sm">
              {errorDocs.solutions.map((solution, i) => (
                <li key={i}>{solution}</li>
              ))}
            </ul>
            
            {errorDocs.supportLink && (
              <div className="mt-3 text-center">
                <a 
                  href={errorDocs.supportLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-secondary-600 hover:underline text-sm"
                >
                  Más información
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {onAction && (
        <div className="mt-4 text-center">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          >
            {actionText}
          </button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-xs text-primary-700">
          SmartRotom Error Code: <span className="font-bold">{formattedCode}</span>
        </p>
      </div>
    </motion.div>
  )
}