"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
  variant?: 'default' | 'blue' | 'orange';
}

export function Combobox({ 
  data, 
  value, 
  onChange, 
  placeholder = "Buscar Elemento", 
  disabled = false, 
  className,
  variant = 'default'
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setOpen(false);
    onChange(newValue);
  };

  const variantStyles = {
    default: {
      button: "bg-background text-foreground border-input",
      content: "",
      input: "",
      item: "text-foreground",
      itemSelected: "bg-accent",
    },
    blue: {
      button: "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 focus:ring-blue-500",
      content: "bg-blue-50 border-blue-200",
      input: "bg-blue-100 text-blue-900 placeholder-blue-400",
      item: "text-blue-900 hover:bg-blue-200",
      itemSelected: "bg-blue-300 text-blue-900",
    },
    orange: {
      button: "bg-gray-800 text-orange-100 border-orange-600 hover:bg-gray-700 focus:ring-orange-500",
      content: "bg-gray-800 border-orange-600",
      input: "bg-gray-700 text-orange-100 placeholder-orange-300 border-orange-600 focus:ring-orange-500",
      item: "text-orange-100 hover:bg-gray-700",
      itemSelected: "bg-orange-900 text-orange-100",
    },
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between",
            variantStyles[variant].button,
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
      <PopoverContent className={cn(
        "w-[200px] p-0",
        variantStyles[variant].content
      )}>
        <Command className={variant === 'orange' ? 'bg-gray-800 rounded-md' : ''}>
          <CommandInput 
            dark={variant === 'orange'}
            placeholder={placeholder} 
            className={cn(
              variantStyles[variant].input,
              'w-full'
            )}
          />
          <CommandList>
            <CommandEmpty className={variant === 'orange' ? 'text-orange-300' : ''}>No element found.</CommandEmpty>
            <CommandGroup>
              {data.map((element) => (
                <CommandItem
                  key={element.value}
                  value={element.value}
                  keywords={[element.label]}
                  onSelect={handleSelect}
                  className={cn(
                    variantStyles[variant].item,
                    value === element.value && variantStyles[variant].itemSelected
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === element.value ? "opacity-100" : "opacity-0",
                      variant === 'orange' && "text-orange-500"
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