import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import { AllPackProbabilities } from '../types'
import PercentageToDecimal from "./PercentageToDecimal"
import { useTranslations } from "next-intl"

interface ProbabilityTableProps {
  probabilities: AllPackProbabilities
}

export function ProbabilityTable({ probabilities }: ProbabilityTableProps) {
  const t = useTranslations('tcgpocket')
  
  return (
    <div className="rounded-xl border border-edge/50 overflow-hidden bg-layer-2/30">
      <Table>
        <TableHeader>
          <TableRow className="bg-layer-3/50 border-edge/50 hover:bg-layer-3/70">
            <TableHead className="text-ink font-semibold">{t('bestPack.table.packName')}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.card', { number: 1 })}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.card', { number: 2 })}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.card', { number: 3 })}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.card', { number: 4 })}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.card', { number: 5 })}</TableHead>
            <TableHead className="text-ink font-semibold">{t('bestPack.table.total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(probabilities).map(([packName, packProbabilities]) => (
            <TableRow 
              key={packName} 
              className="bg-layer-2/30 border-edge/30 hover:bg-layer-3/30 transition-colors"
            >
              <TableCell className="text-ink font-medium">{t(`packs.${packName}`)}</TableCell>
              {packProbabilities.newCardProbabilities.map((prob: number, index: number) => (
                <TableCell key={index} className="text-ink">
                  <PercentageToDecimal value={prob * 100} />
                </TableCell>
              ))}
              <TableCell className="text-ink font-semibold">
                <PercentageToDecimal value={packProbabilities.aggregateProbability * 100} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}