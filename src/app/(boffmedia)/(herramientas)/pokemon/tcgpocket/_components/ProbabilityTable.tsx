import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AllPackProbabilities } from '../types'
import PercentageToDecimal from "./PercentageToDecimal"
import { useTranslations } from "next-intl"

interface ProbabilityTableProps {
  probabilities: AllPackProbabilities
}

export function ProbabilityTable({ probabilities }: ProbabilityTableProps) {
  const t = useTranslations('tcgpocket')
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('bestPack.table.packName')}</TableHead>
          <TableHead>{t('bestPack.table.card', { number: 1 })}</TableHead>
          <TableHead>{t('bestPack.table.card', { number: 2 })}</TableHead>
          <TableHead>{t('bestPack.table.card', { number: 3 })}</TableHead>
          <TableHead>{t('bestPack.table.card', { number: 4 })}</TableHead>
          <TableHead>{t('bestPack.table.card', { number: 5 })}</TableHead>
          <TableHead>{t('bestPack.table.total')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(probabilities).map(([packName, packProbabilities]) => (
          <TableRow key={packName}>
            <TableCell>{t(`packs.${packName}`)}</TableCell>
            {packProbabilities.newCardProbabilities.map((prob: number, index: number) => (
              <TableCell key={index}>
                <PercentageToDecimal value={prob * 100} />
              </TableCell>
            ))}
            <TableCell>
              <PercentageToDecimal value={packProbabilities.aggregateProbability * 100} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}