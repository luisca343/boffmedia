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

type ComboboxVariant = "default" | "wingull" | "orange" | "boff"

interface ComboboxOption {
  label: string;
  value: any;
  /** Optional leading visual (e.g. a thumbnail) rendered before the label. */
  icon?: React.ReactNode;
}

interface ComboboxProps {
  data: ComboboxOption[];
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
      button: "bg-layer-3 text-ink border-edge hover:bg-layer-3 focus:ring-primary transition-colors disabled:opacity-50",
      content: "bg-layer-3 border-edge",
      command: "bg-layer-3 rounded-md",
      input: "bg-layer-3 text-ink placeholder-ink-dim border-edge focus:ring-primary",
      item: "text-ink bg-layer-3 hover:bg-layer-3",
      itemSelected: "bg-layer-3 text-ink",
      emptyText: "text-ink"
    },
    wingull: {
      button: "bg-secondary-soft text-secondary-hover border-secondary-active hover:bg-secondary-soft focus:ring-secondary",
      content: "bg-secondary-soft border-secondary-active",
      command: "bg-secondary-soft rounded-md",
      input: "bg-secondary-soft text-secondary-hover placeholder-secondary border-secondary-active focus:ring-secondary",
      item: "text-secondary-hover bg-secondary-soft hover:bg-secondary-soft",
      itemSelected: "bg-secondary-soft text-secondary-hover",
      emptyText: "text-secondary-hover"
    },
    orange: {
      button: "bg-layer-2 text-orange-100 border-orange-600 hover:bg-layer-3 focus:ring-orange-500",
      content: "bg-layer-2 border-orange-600",
      command: "bg-layer-2 rounded-md",
      input: "bg-layer-3 text-orange-100 placeholder-orange-300 border-orange-600 focus:ring-orange-500",
      item: "text-orange-100 bg-layer-2 hover:bg-layer-1",
      itemSelected: "bg-layer-1 text-orange-100",
      emptyText: "text-orange-300"
    },
    boff: {
      button: "bg-layer-2 text-ink border-edge/60 hover:bg-layer-3 hover:border-secondary/50 focus:ring-secondary/30 disabled:opacity-40 transition-all duration-200",
      content: "bg-layer-2 border-edge/60",
      command: "bg-layer-2 rounded-md",
      input: "bg-layer-2 text-ink placeholder-ink-dim border-edge/60 focus:ring-secondary/30",
      item: "text-ink bg-layer-2 hover:bg-layer-3",
      itemSelected: "bg-layer-3 text-secondary-hover",
      emptyText: "text-ink-muted"
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
          <span className="flex min-w-0 items-center gap-2 text-left">
            {value && data.find((element) => element.value === value)?.icon}
            <span className="min-w-0 truncate">
              {value && data.find((element) => element.value === value)?.label
                ? data.find((element) => element.value === value)?.label
                : "Selecciona un elemento"}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0",
          // Grow to fit the option labels (at least as wide as the trigger),
          // capped to the available viewport width so long ids stay readable.
          "w-auto max-w-[min(28rem,var(--radix-popover-content-available-width))]",
          variantStyles[variant].content
        )}
        style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
        align="start"
      >
        <Command
          variant={variant === 'wingull' || variant === 'boff' ? variant : 'default'}
          className={variantStyles[variant].command}
        >
          <CommandInput
            dark={variant === 'orange' || variant === 'wingull' || variant === 'boff'}
            placeholder={placeholder}
            className={cn(variantStyles[variant].input, 'w-full')}
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
                    "whitespace-normal break-all",
                    variantStyles[variant].item,
                    value === element.value && variantStyles[variant].itemSelected
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0 self-start mt-0.5",
                      value === element.value ? "opacity-100" : "opacity-0",
                      variant === 'default' && "text-primary-hover",
                      variant === 'orange' && "text-orange-500",
                      variant === 'wingull' && "text-secondary-hover",
                      variant === 'boff' && "text-secondary-hover"
                    )}
                  />
                  {element.icon && (
                    <span className="mr-2 shrink-0 self-start">{element.icon}</span>
                  )}
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

export type { ComboboxVariant, ComboboxOption }