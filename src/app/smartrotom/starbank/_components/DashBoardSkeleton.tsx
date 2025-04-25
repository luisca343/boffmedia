import { BankSection } from "./BankSection";

export function DashboardSkeleton() {
  return (
    <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-white rounded-md border border-blue-200 p-6 md:col-span-1">
          <div className="h-6 w-32 bg-blue-100 rounded mb-8"></div>
          <div className="h-12 w-48 bg-blue-100 rounded mb-12"></div>
          <div className="h-8 w-full bg-blue-100 rounded"></div>
        </div>
        
        <div className="h-64 bg-white rounded-md border border-blue-200 p-6 md:col-span-2">
          <div className="h-6 w-32 bg-blue-100 rounded mb-4"></div>
          <div className="h-40 bg-blue-50 rounded"></div>
        </div>
        
        <div className="md:col-span-3 bg-white rounded-md border border-blue-200 p-6">
          <div className="h-6 w-32 bg-blue-100 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-blue-50 rounded-lg"></div>
            ))}
          </div>
        </div>
        
        <div className="h-80 bg-white rounded-md border border-blue-200 p-6 md:col-span-3">
          <div className="h-6 w-48 bg-blue-100 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-blue-50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}