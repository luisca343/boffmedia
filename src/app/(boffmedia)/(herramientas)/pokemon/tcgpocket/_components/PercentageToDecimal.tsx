import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PercentageToDecimalProps {
    num: number
    fixed: number
}

export default function PercentageToDecimal({ num, fixed }: PercentageToDecimalProps) {
    const formatNumber = (n: number, f: number) => {
        n = Math.min(Math.max(n, 0), 100)
        const factor = Math.pow(10, f)
        const roundedNum = Math.round(n * factor) / factor
        const result = roundedNum.toFixed(f)
        return parseFloat(result).toString()
    }

    const clampedNum = Math.min(Math.max(num, 0), 100)
    const formattedNumber = formatNumber(clampedNum, fixed)
    const originalNumber = clampedNum.toString()

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">{formattedNumber}%</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Valor completo: {originalNumber}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}