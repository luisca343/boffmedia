import { ChevronLeft, ChevronRight } from "lucide-react";

interface CollectionPaginationProps {
  currentPage: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function CollectionPagination({
  currentPage,
  pageCount,
  onPreviousPage,
  onNextPage
}: CollectionPaginationProps) {
  if (pageCount <= 1) return null;
  
  return (
    <div className="flex justify-between items-center mt-6">
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 0}
        className={`flex items-center space-x-1 px-3 py-1 rounded ${
          currentPage === 0
            ? "bg-surface-800 text-surface-500 cursor-not-allowed border border-surface-700"
            : "bg-secondary-900/60 text-cyan-300 hover:bg-secondary-800/80 border border-secondary-700/50"
        }`}
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>
      
      <span className="text-surface-300">
        Página {currentPage + 1} de {pageCount}
      </span>
      
      <button
        onClick={onNextPage}
        disabled={currentPage >= pageCount - 1}
        className={`flex items-center space-x-1 px-3 py-1 rounded ${
          currentPage >= pageCount - 1
            ? "bg-surface-800 text-surface-500 cursor-not-allowed border border-surface-700"
            : "bg-secondary-900/60 text-cyan-300 hover:bg-secondary-800/80 border border-secondary-700/50"
        }`}
      >
        <span>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}