"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  data: { label: string, value: any }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({ 
  data, 
  value, 
  onChange, 
  placeholder = "Buscar Elemento", 
  disabled = false, 
  className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setOpen(false);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between bg-main-800 text-orange-400 border-orange-500 hover:bg-main-700 focus:ring-orange-400",
            className
          )}
          disabled={disabled}
        >
          {value && data.find((element) => element.value === value)?.label
            ? data.find((element) => element.value === value)?.label
            : "Selecciona un elemento"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-main-800 border-orange-500">
        <Command className="bg-main-800 rounded-md">
          <CommandInput 
            placeholder={placeholder} 
            className="bg-main-700 text-orange-100 placeholder-orange-300 border-orange-500 focus:ring-orange-400"
          />
          <CommandList>
            <CommandEmpty className="text-orange-300">No element found.</CommandEmpty>
            <CommandGroup>
              {data.map((element) => (
                <CommandItem
                  key={element.value}
                  value={element.value}
                  onSelect={handleSelect}
                  className="text-orange-100 hover:bg-main-700 data-[selected=true]:bg-orange-500 data-[selected=true]:text-main-950"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === element.value ? "opacity-100" : "opacity-0",
                      "text-orange-400"
                    )}
                  />
                  {element.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}