import { redirect } from 'next/navigation';

// Retired: the BattleSim damage calculator is superseded by the v3 VGC calculator.
export default function LegacyCalcRedirect() {
  redirect('/pokemon/vgc/damage-calculator');
}
