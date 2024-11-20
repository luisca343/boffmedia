import { FaAward, FaMedal, FaStar } from 'react-icons/fa'
import { GiCutDiamond, GiZombie, GiFootprint, GiShotgun, GiHuntingRifle, GiCardRandom, GiMagicWand } from 'react-icons/gi'
import { cn } from "@/lib/utils"

type RarityType = 'bronce' | 'plata' | 'oro' | 'platino' | 'diamante'

type Achievement = {
  name: string
  description: string
  rarity: RarityType
  achievementIcon: React.ElementType
}

const rarityConfig: Record<RarityType, { icon: React.ElementType; color: string; bgColor: string }> = {
  'bronce': { icon: FaAward, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'plata': { icon: FaAward, color: 'text-gray-400', bgColor: 'bg-gray-100' },
  'oro': { icon: FaMedal, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  'platino': { icon: FaStar, color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
  'diamante': { icon: GiCutDiamond, color: 'text-blue-500', bgColor: 'bg-blue-100' },
}

function AchievementBadge({ rarity, className }: { rarity: RarityType; className?: string }) {
  const { icon: Icon, color, bgColor } = rarityConfig[rarity]

  return (
    <div className={cn(
      "inline-flex items-center justify-center w-12 h-12 rounded-full",
      bgColor,
      className
    )}>
      <Icon className={cn("w-8 h-8", color)} aria-hidden="true" />
      <span className="sr-only">{`Insignia de ${rarity}`}</span>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const AchievementIcon = achievement.achievementIcon

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
      <AchievementIcon className="w-12 h-12 text-gray-600" />
      <div className="flex-grow">
        <h3 className="text-lg font-semibold">{achievement.name}</h3>
        <p className="text-sm text-gray-600">{achievement.description}</p>
      </div>
      <AchievementBadge rarity={achievement.rarity} />
    </div>
  )
}

export default function ZomboidAchievements() {
  const achievements: Achievement[] = [
    { name: "Exterminador Novato", description: "Elimina 100 zombies", rarity: 'bronce', achievementIcon: GiZombie },
    { name: "Exterminador Experimentado", description: "Elimina 1,000 zombies", rarity: 'plata', achievementIcon: GiZombie },
    { name: "Exterminador Experto", description: "Elimina 10,000 zombies", rarity: 'oro', achievementIcon: GiZombie },
    { name: "Leyenda Zombie", description: "Elimina 100,000 zombies", rarity: 'diamante', achievementIcon: GiZombie },
    { name: "Caminante", description: "Camina 10 km", rarity: 'bronce', achievementIcon: GiFootprint },
    { name: "Trotamundos", description: "Camina 50 km", rarity: 'plata', achievementIcon: GiFootprint },
    { name: "Maratonista", description: "Camina 100 km", rarity: 'oro', achievementIcon: GiFootprint },
    { name: "Explorador Legendario", description: "Camina 500 km", rarity: 'diamante', achievementIcon: GiFootprint },
    { name: "Cazador Novato", description: "Encuentra tu primera escopeta", rarity: 'bronce', achievementIcon: GiShotgun },
    { name: "Francotirador Principiante", description: "Encuentra tu primer rifle", rarity: 'plata', achievementIcon: GiHuntingRifle },
    { name: "Coleccionista Pokémon Novato", description: "Colecciona 10 cartas Pokémon diferentes", rarity: 'bronce', achievementIcon: GiCardRandom },
    { name: "Coleccionista Pokémon Avanzado", description: "Colecciona 50 cartas Pokémon diferentes", rarity: 'plata', achievementIcon: GiCardRandom },
    { name: "Maestro Coleccionista Pokémon", description: "Colecciona 100 cartas Pokémon diferentes", rarity: 'oro', achievementIcon: GiCardRandom },
    { name: "Coleccionista Pokémon Legendario", description: "Colecciona todas las cartas Pokémon disponibles", rarity: 'diamante', achievementIcon: GiCardRandom },
    { name: "Card Captor", description: "Encuentra el bastón de Sakura", rarity: 'platino', achievementIcon: GiMagicWand },
  ]

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Logros de Zomboid</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement, index) => (
          <AchievementCard key={index} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}