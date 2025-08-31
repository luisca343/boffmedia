"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/primitives/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/primitives/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives/popover"

type ComboboxVariant = "default" | "wingull" | "orange"

interface ComboboxProps {
  data: { label: string, value: any }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: ComboboxVariant;
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
      button: "bg-surface-700 text-surface-50 border-surface-600 hover:bg-surface-700 focus:ring-primary-400 transition-colors disabled:opacity-50",
      content: "bg-surface-700 border-surface-600",
      command: "bg-surface-700 rounded-md",
      input: "bg-surface-700 text-surface-50 placeholder-surface-400 border-surface-600 focus:ring-primary-400",
      item: "text-surface-50 bg-surface-700 hover:bg-surface-700",
      itemSelected: "bg-surface-700 text-surface-50",
      emptyText: "text-surface-300"
    },
    wingull: {
      button: "bg-secondary-900 text-secondary-300 border-secondary-800 hover:bg-secondary-800 focus:ring-secondary-400",
      content: "bg-secondary-900 border-secondary-800",
      command: "bg-secondary-900 rounded-md",
      input: "bg-secondary-900 text-secondary-300 placeholder-secondary-500 border-secondary-800 focus:ring-secondary-400",
      item: "text-secondary-300 bg-secondary-900 hover:bg-secondary-950",
      itemSelected: "bg-secondary-950 text-secondary-300",
      emptyText: "text-secondary-300"
    },
    orange: {
      button: "bg-surface-800 text-orange-100 border-orange-600 hover:bg-surface-700 focus:ring-orange-500",
      content: "bg-surface-800 border-orange-600",
      command: "bg-surface-800 rounded-md",
      input: "bg-surface-700 text-orange-100 placeholder-orange-300 border-orange-600 focus:ring-orange-500",
      item: "text-orange-100 bg-surface-800 hover:bg-surface-900",
      itemSelected: "bg-surface-900 text-orange-100",
      emptyText: "text-orange-300"
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
            "w-full justify-between min-w-[200px]",
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
      <PopoverContent 
        className={cn(
          "p-0",
          variantStyles[variant].content
        )}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
      >
        <Command className={variantStyles[variant].command}>
          <CommandInput 
            dark={variant === 'orange' || variant === 'wingull'}
            placeholder={placeholder} 
            className={cn(
              variantStyles[variant].input,
              'w-full'
            )}
          />
          <CommandList>
            <CommandEmpty className={variantStyles[variant].emptyText}>
              No element found.
            </CommandEmpty>
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
                      variant === 'default' && "text-primary-400",
                      variant === 'orange' && "text-orange-500",
                      variant === 'wingull' && "text-secondary-400"
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

export type { ComboboxVariant }