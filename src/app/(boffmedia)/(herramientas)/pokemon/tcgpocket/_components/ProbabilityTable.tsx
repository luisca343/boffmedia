import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AllPackProbabilities } from '../types'
import PercentageToDecimal from "./PercentageToDecimal"

interface ProbabilityTableProps {
  probabilities: AllPackProbabilities
}

export function ProbabilityTable({ probabilities }: ProbabilityTableProps) {
    console.log(probabilities)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pack Name</TableHead>
          <TableHead>1 Card</TableHead>
          <TableHead>2 Cards</TableHead>
          <TableHead>3 Cards</TableHead>
          <TableHead>4+ Cards</TableHead>
          <TableHead>Aggregate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(probabilities).map(([packName, packProbabilities]) => (
          <TableRow key={packName}>
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