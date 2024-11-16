import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AllPackProbabilities } from '../types'
import PercentageToDecimal from "./PercentageToDecimal"
import { useTranslations } from "next-intl"

interface ProbabilityTableProps {
  probabilities: AllPackProbabilities
}

export function ProbabilityTable({ probabilities }: ProbabilityTableProps) {
    const trans = useTranslations('tcgpocket')
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pack Name</TableHead>
          <TableHead>Carta 1</TableHead>
          <TableHead>Carta 2</TableHead>
          <TableHead>Carta 3</TableHead>
          <TableHead>Carta 4</TableHead>
          <TableHead>Carta 5</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(probabilities).map(([packName, packProbabilities]) => (
          <TableRow key={packName}>
            <TableCell>{trans(`packs.${packName}`)}</TableCell>
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