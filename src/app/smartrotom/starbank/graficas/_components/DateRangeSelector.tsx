"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/primitives/calendar";
import { Button } from "@/components/ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown } from "lucide-react";

interface DateRangeSelectorProps {
  dateRange: [Date, Date];
  onDateChange: (dates: [Date, Date]) => void;
}

export default function DateRangeSelector({ dateRange, onDateChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<[Date | undefined, Date | undefined]>([
    dateRange[0],
    dateRange[1]
  ]);
  
  // Predefined date ranges
  const dateRanges = [
    { label: "Última semana", days: 7 },
    { label: "Último mes", days: 30 },
    { label: "Últimos 3 meses", days: 90 },
    { label: "Último año", days: 365 }
  ];
  
  // Apply date range and close popover
  const applyDateRange = () => {
    if (localDateRange[0] && localDateRange[1]) {
      onDateChange([localDateRange[0], localDateRange[1]]);
      setIsOpen(false);
    }
  };
  
  // Apply predefined range
  const applyPredefinedRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setLocalDateRange([startDate, endDate]);
    onDateChange([startDate, endDate]);
    setIsOpen(false);
  };
  
  // Format the date range for display
  const formatDateRange = (dates: [Date, Date]) => {
    return `${format(dates[0], "dd/MM/yyyy", { locale: es })} - ${format(dates[1], "dd/MM/yyyy", { locale: es })}`;
  };
  
  return (
    <div className="w-full max-w-xs">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {formatDateRange(dateRange)}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex gap-2 mb-3">
              {dateRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPredefinedRange(range.days)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              defaultMonth={localDateRange[0]}
              selected={{
                from: localDateRange[0],
                to: localDateRange[1]
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setLocalDateRange([range.from, range.to]);
                }
              }}
              numberOfMonths={2}
            />
            <div className="flex justify-end mt-3">
              <Button onClick={applyDateRange}>Aplicar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}