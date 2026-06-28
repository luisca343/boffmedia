import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"

interface PercentageToDecimalProps {
    value: number
    fixed?: number
}

export default function PercentageToDecimal({ value, fixed = 2 }: PercentageToDecimalProps) {
    const formatNumber = (n: number, f: number) => {
        n = Math.min(Math.max(n, 0), 100)
        const factor = Math.pow(10, f)
        const roundedNum = Math.round(n * factor) / factor
        return roundedNum.toFixed(f)
    }

    const clampedValue = Math.min(Math.max(value, 0), 100)
    const formattedNumber = formatNumber(clampedValue, fixed)
    const originalNumber = clampedValue.toFixed(4)

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help text-ink hover:text-ink transition-colors">
                        {formattedNumber}%
                    </span>
                </TooltipTrigger>
                <TooltipContent className="bg-layer-3/95 border-edge/50 backdrop-blur-sm">
                    <p className="text-ink">Valor completo: {originalNumber}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}