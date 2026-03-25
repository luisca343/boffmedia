import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/primitives/collapsible"
import { ChevronDown } from "lucide-react"

export function PokedexSection({
    title,
    children,
    id,
    className = "",
    btn = "",
  }: {
    title: string
    children: React.ReactNode
    id?: string
    className?: string
    btn?: React.ReactNode
  }) {
    return (
      <Collapsible defaultOpen={true} className={`w-full max-w-[95vw] 2xl:max-w-[90vw] mx-auto my-2 py-2 ${className}`} id={id}>
        <CollapsibleTrigger className="flex w-full items-center justify-between border-b-2 border-surface-700 pb-2 text-start text-xl font-semibold text-surface-100">
          {title}
          <div className="flex items-center">
            {btn && <span className="mr-4 text-sm">{btn}</span>}
            <ChevronDown className="h-5 w-5 text-surface-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
      </Collapsible>
    )
  }