import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { formatMoney } from "../bankUtils";
import { BankSectionButton } from "./BankSection";
import { useRouter } from "next/navigation";

interface TransactionSuccessProps {
  amount: number;
  recipientName: string;
  concept: string;
  onClose: () => void;
}

export function TransactionSuccess({ 
  amount, 
  recipientName, 
  concept, 
  onClose 
}: TransactionSuccessProps) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="h-16 w-16 rounded-full bg-highlight-100 flex items-center justify-center text-highlight-600 mb-4">
        <CheckCircleIcon className="h-10 w-10" />
      </div>
      
      <h2 className="text-xl font-semibold text-secondary-900 mb-2">
        ¡Transferencia Exitosa!
      </h2>
      
      <p className="text-sm text-secondary-600 mb-6">
        Has transferido {formatMoney(amount)} a {recipientName}
      </p>
      
      <div className="w-full bg-secondary-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-xs text-secondary-500">Monto</p>
            <p className="font-medium">{formatMoney(amount)}</p>
          </div>
          <div>
            <p className="text-xs text-secondary-500">Destinatario</p>
            <p className="font-medium">{recipientName}</p>
          </div>
          <div>
            <p className="text-xs text-secondary-500">Concepto</p>
            <p className="font-medium">{concept || "Transferencia"}</p>
          </div>
          <div>
            <p className="text-xs text-secondary-500">Fecha</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <BankSectionButton 
          onClick={() => router.push("/smartrotom/starbank/transacciones")}
          className="bg-white hover:bg-secondary-50 text-secondary-700 border border-secondary-200"
        >
          Ver Transacciones
        </BankSectionButton>
        
        <BankSectionButton 
          onClick={onClose}
          className="bg-secondary-600 hover:bg-secondary-700 text-white"
        >
          Nueva Transferencia
        </BankSectionButton>
      </div>
    </div>
  );
}