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
            ? "bg-layer-2 text-ink-muted cursor-not-allowed border border-edge"
            : "bg-secondary-soft/60 text-cyan-300 hover:bg-secondary-soft/80 border border-secondary-active/50"
        }`}
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>
      
      <span className="text-ink">
        Página {currentPage + 1} de {pageCount}
      </span>
      
      <button
        onClick={onNextPage}
        disabled={currentPage >= pageCount - 1}
        className={`flex items-center space-x-1 px-3 py-1 rounded ${
          currentPage >= pageCount - 1
            ? "bg-layer-2 text-ink-muted cursor-not-allowed border border-edge"
            : "bg-secondary-soft/60 text-cyan-300 hover:bg-secondary-soft/80 border border-secondary-active/50"
        }`}
      >
        <span>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}