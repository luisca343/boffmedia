import { BankSection, BankSectionHeader, BankSectionContent } from "../../_components/BankSection";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartsSkeleton() {
  return (
    <div className="max-w-[90%] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header section skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BankSection className="w-full">
          <BankSectionHeader>Seleccionar Cuenta</BankSectionHeader>
          <BankSectionContent>
            <Skeleton className="h-10 w-64" />
          </BankSectionContent>
        </BankSection>
        
        <BankSection className="w-full">
          <BankSectionHeader>Periodo de Análisis</BankSectionHeader>
          <BankSectionContent>
            <Skeleton className="h-10 w-64" />
          </BankSectionContent>
        </BankSection>
      </div>
      
      {/* Metrics skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-8 w-36" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20 mt-3" />
          </div>
        ))}
      </div>
      
      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BankSection className="w-full">
          <BankSectionHeader>Evolución de Balance</BankSectionHeader>
          <BankSectionContent>
            <Skeleton className="h-[350px] w-full" />
          </BankSectionContent>
        </BankSection>
        
        <BankSection className="w-full">
          <BankSectionHeader>Ingresos y Gastos</BankSectionHeader>
          <BankSectionContent>
            <Skeleton className="h-[350px] w-full" />
          </BankSectionContent>
        </BankSection>
      </div>
      
      {/* Transaction type distribution skeleton */}
      <BankSection className="w-full">
        <BankSectionHeader>Distribución por Tipo de Transacción</BankSectionHeader>
        <BankSectionContent>
          <Skeleton className="h-[400px] w-full" />
        </BankSectionContent>
      </BankSection>
    </div>
  );
}