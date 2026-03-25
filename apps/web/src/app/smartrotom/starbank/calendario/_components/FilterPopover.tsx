"use client";

import { Button } from "@/components/ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover";
import { Checkbox } from "@/components/ui/primitives/checkbox";
import { Label } from "@/components/ui/primitives/label";
import { Filter } from "lucide-react";

interface FilterPopoverProps {
  transactionTypes: string[];
  selectedTypes: string[];
  onFilterChange: (type: string) => void;
}

export function FilterPopover({ transactionTypes, selectedTypes, onFilterChange }: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtrar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <h3 className="text-sm font-medium mb-3">Tipos de transacción</h3>
        <div className="space-y-2">
          {transactionTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`filter-${type}`} 
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => onFilterChange(type)}
              />
              <Label htmlFor={`filter-${type}`} className="text-sm">
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}