import { Quest, CommonReward } from '../types'

export function calculateTotalRewards(quests: Quest[], commonRewards: CommonReward[]) {
  const totalRewards: { [key: string]: number } = {}

  // Apply common rewards once per battle task
  quests.forEach(quest => {
      commonRewards.forEach(reward => {
        console.log(reward)
        if (totalRewards[reward.id]) {
          totalRewards[reward.id] += parseInt(reward.quantity)
        } else {
          totalRewards[reward.id] = parseInt(reward.quantity)
        }
      })
  })

  // Add quest-specific rewards
  quests.forEach(quest => {
    quest.battleTasks.forEach(task => {
      const { id, quantity } = task.reward
      console.log(id, quantity)
      if (totalRewards[id]) {
        totalRewards[id] += quantity
      } else {
        totalRewards[id] = quantity
      }
    })
  })

  return totalRewards
}
