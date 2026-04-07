import React from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Badge } from "@/components/ui/primitives/badge";
import { Search, Grid, List, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  filter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  itemsCount?: number;
  itemsLabel?: string;
  showViewMode?: boolean;
  showItemsCount?: boolean;
  className?: string;
  children?: React.ReactNode; // For custom filter components
}

export function SectionFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  itemsCount = 0,
  itemsLabel = "elementos",
  showViewMode = false,
  showItemsCount = true,
  className = "",
  children,
}: SectionFiltersProps) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 items-center justify-between", className)}>
      {/* Search */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-surface-700/50 border-surface-600 text-surface-50 placeholder:text-surface-400 focus:border-accent-500/50 focus:ring-accent-500/20"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Custom filter components (passed as children) */}
        {children}

        {/* Items Count Badge */}
        {showItemsCount && (
          <div className="flex items-center gap-2">
            <span className="text-surface-400 text-sm font-medium capitalize">{itemsLabel}:</span>
            <Badge className="bg-accent-500 text-white hover:bg-accent-600 font-bold">
              {itemsCount}
            </Badge>
          </div>
        )}

        {/* View Mode Toggle */}
        {showViewMode && viewMode && onViewModeChange && (
          <div className="flex bg-surface-700/50 rounded-lg p-1 border border-surface-600">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "px-3 py-2",
                viewMode === 'grid' 
                  ? 'bg-accent-500 text-white hover:bg-accent-600' 
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-600'
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "px-3 py-2",
                viewMode === 'list' 
                  ? 'bg-accent-500 text-white hover:bg-accent-600' 
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-600'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
