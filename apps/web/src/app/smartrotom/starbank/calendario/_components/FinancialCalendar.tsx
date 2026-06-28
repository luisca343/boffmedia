"use client";

import { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  addDays, 
  subDays,
  isSameDay, 
  isSameMonth, 
  isToday, 
  getDay 
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/primitives/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../../bankUtils";

interface FinancialCalendarProps {
  monthView: Date;
  setMonthView: (date: Date) => void;
  selectedDay: Date | undefined;
  setSelectedDay: (date: Date) => void;
  transactionsByDate: Record<string, any[]>;
  onTodayClick: () => void;
}

export function FinancialCalendar({
  monthView,
  setMonthView,
  selectedDay,
  setSelectedDay,
  transactionsByDate,
  onTodayClick
}: FinancialCalendarProps) {
  // Navigate to previous month
  const handlePrevMonth = () => {
    setMonthView(subMonths(monthView, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setMonthView(addMonths(monthView, 1));
  };
  
  // Helper to generate calendar days for a month
  const generateCalendarDays = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
    // Get the start day (Monday is 0, Sunday is 6)
    let startDay = getDay(start);
    // Adjust for week starting on Monday
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const daysArray: Date[] = [];
    
    // Add days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const day = subDays(start, i + 1);
      daysArray.push(day);
    }
    
    // Add all days of current month
    let currentDay = start;
    while (currentDay <= end) {
      daysArray.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
    
    // Add days from next month to complete a grid
    const remainingDays = 42 - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = addDays(end, i);
      daysArray.push(day);
    }
    
    return daysArray;
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium">
            {format(monthView, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" onClick={onTodayClick}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Hoy
        </Button>
      </div>
      
      {/* Custom calendar implementation */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map((day) => (
          <div key={day} className="h-10 flex items-center justify-center font-medium text-blue-900">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {generateCalendarDays(monthView).map((day, index) => {
          // Skip rendering if day is not valid
          if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
            return <div key={index} className="min-h-14 p-1" />;
          }

          try {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTransactions = transactionsByDate[dateKey] || [];
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const isCurrentMonth = isSameMonth(day, monthView);
            
            // Calculate income and expense totals for the day
            let incomeTotal = 0;
            let expenseTotal = 0;
            
            dayTransactions.forEach((tx: any) => {
              if (tx.isIncome) {
                incomeTotal += tx.amount;
              } else {
                expenseTotal += tx.amount;
              }
            });
            
            return (
              <div 
                key={index}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-16 p-2 cursor-pointer border rounded-md transition-all duration-200",
                  !isCurrentMonth && "opacity-40 bg-base",
                  isSelected && "bg-blue-100 border-blue-400 shadow-sm scale-105",
                  isToday(day) && !isSelected && "border-blue-500 border-2",
                  dayTransactions.length > 0 && "hover:shadow-md",
                  dayTransactions.length === 0 && "hover:bg-base"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) && "text-blue-600 font-bold",
                    !isCurrentMonth && "text-ink-muted"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayTransactions.length > 0 && (
                    <span className="text-xs font-medium bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {dayTransactions.length}
                    </span>
                  )}
                </div>
                
                {dayTransactions.length > 0 && (
                  <div className="space-y-1">
                    {incomeTotal > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-warning-hover rounded-full" />
                        <span className="text-[10px] text-warning font-medium">
                          +{formatMoney(incomeTotal).replace('¥', '').trim()}
                        </span>
                      </div>
                    )}
                    {expenseTotal > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-red-400 rounded-full" />
                        <span className="text-[10px] text-red-700 font-medium">
                          -{formatMoney(expenseTotal).replace('¥', '').trim()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } catch (error) {
            console.error("Error rendering day:", error, day);
            return <div key={index} className="min-h-14 p-1" />;
          }
        })}
      </div>
    </div>
  );
}