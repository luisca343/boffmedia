import DayReward from "./DayReward";
import { DailyRewardItem, DailyRewardsConfig } from "@/generated/api";

interface DaysGridProps {
  totalDays: number;
  currentDay: number;
  claimed: boolean;
  rewardsConfig: DailyRewardsConfig | null;
  isLoading: boolean;
}

export default function DaysGrid({
  totalDays,
  currentDay,
  claimed,
  rewardsConfig,
  isLoading
}: DaysGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-3">
      {[...Array(totalDays)].map((_, i) => {
        const dayNumber = i + 1;
        // Check if there's a reward for this day from server
        const dayReward: DailyRewardItem | undefined = 
          rewardsConfig?.rewards.find((r: DailyRewardItem) => r.day === dayNumber);
        
        return (
          <DayReward 
            key={i}
            day={dayNumber} 
            currentDay={currentDay} 
            claimed={claimed}
            dayReward={dayReward}
            isLoading={isLoading}
          />
        );
      })}
    </div>
  );
}