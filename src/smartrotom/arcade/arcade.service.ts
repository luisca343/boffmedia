import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { smartRotomArcadeStreaks, smartRotomInventory, SmartRotomInventoryItem, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { DailyRewardsConfig, loadRewardsConfig, DailyRewardItem } from '../../smartrotom/_main/_config/daily-rewards.config';
import { StarbankService } from '../starbank/starbank.service';
import { ArcadeStreak, ClaimRewardResponse } from '../_dto/arcade-streak.dto';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './_dto/lottbox.dto';
import { getRarityFromWeight, lootboxConfig, rarityRanges } from './lootboxConfig';

@Injectable()
export class ArcadeService implements OnModuleInit {
  private rewardsConfig: DailyRewardsConfig;
  
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private starbankService: StarbankService
  ) {}
  
  onModuleInit() {
    this.rewardsConfig = loadRewardsConfig();
    console.log(`Loaded daily rewards configuration: ${this.rewardsConfig.totalDays} total days`);
  }
  
  getWordle() {
    return 'wordle';
  }
  
  async getArcadeStreak(uuid: string): Promise<ArcadeStreak> {
    try {
      // Get current date and reset time (6:00 AM)
      const now = new Date();
      const resetTime = this.getDailyResetTime(now);
      const nextResetTime = this.getNextResetTime(now, resetTime);
      
      // Get the streak record from the database
      const streakRecord = await this.db.select({
        lastClaimed: smartRotomArcadeStreaks.lastClaimed,
        streak: smartRotomArcadeStreaks.streak,
        totalClaims: smartRotomArcadeStreaks.totalClaims,
        lastBanner: smartRotomArcadeStreaks.lastBanner
      })
      .from(smartRotomArcadeStreaks)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid))
      .execute()
      .then(results => results[0] || null);
      
      // Initialize with default values
      const streak = {
        lastClaimed: streakRecord?.lastClaimed || null,
        streak: streakRecord?.streak || 0,
        totalClaims: streakRecord?.totalClaims || 0,
        lastBanner: streakRecord?.lastBanner || null
      };
      
      // Check if the banner has changed since last claim
      const bannerChanged = streak.lastBanner && streak.lastBanner !== this.rewardsConfig.name;
        
      // If banner changed, calculate what the streak will reset to
      let effectiveStreak = streak.streak;
      let bannerChangedMessage = null;
      
      if (bannerChanged) {
        effectiveStreak = 0; // Will become 1 when they claim
        bannerChangedMessage = `The rewards banner has changed from "${streak.lastBanner}" to "${this.rewardsConfig.name}". Your streak will reset on next claim.`;
      }
      
      let claimedToday = false;
      if (streak.lastClaimed) {
        const lastClaimDate = new Date(streak.lastClaimed);
        
        const currentResetTime = this.getDailyResetTime(now);
        
        if (now < currentResetTime) {
          const yesterdayDate = new Date(now);
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayResetTime = this.getDailyResetTime(yesterdayDate);
          
          claimedToday = lastClaimDate >= yesterdayResetTime;
        } 
        else {
          if (this.isSameDay(lastClaimDate, now)) {
            claimedToday = lastClaimDate >= currentResetTime;
          } else {
            claimedToday = false;
          }
        }
      }
      
      // Calculate current position in the reward cycle
      let currentDay = effectiveStreak % this.rewardsConfig.totalDays;
      if(!claimedToday) currentDay = (currentDay + 1);
      if (currentDay === 0) currentDay = this.rewardsConfig.totalDays;
      
      // Get next reward based on whether today's reward was claimed
      const nextReward = this.getRewardForDay(claimedToday ? currentDay + 1 : currentDay);
      
      return {
        lastClaimed: streak.lastClaimed,
        streak: streak.streak,
        totalClaims: streak.totalClaims,
        lastBanner: streak.lastBanner,
        currentDay,
        totalDays: this.rewardsConfig.totalDays,
        nextReward,
        currentBanner: this.rewardsConfig.name,
        claimedToday,
        nextResetTime: nextResetTime.toISOString(),
        bannerChanged,
      };
    } catch (error) {
      console.error('Error getting arcade streak:', error);
      throw error;
    }
  }
  
  // Helper methods to extract the repeated logic
  private getDailyResetTime(date: Date): Date {
    const resetTime = new Date(date);
    resetTime.setHours(6, 0, 0, 0);
    return resetTime;
  }
  
  private getNextResetTime(now: Date, resetTime: Date): Date {
    const nextResetTime = new Date(resetTime);
    if (now >= resetTime) {
      nextResetTime.setDate(nextResetTime.getDate() + 1);
    }
    return nextResetTime;
  }
  
  // Update claimDailyReward to handle banner changes and 6:00 AM reset
  async claimDailyReward(uuid: string): Promise<ClaimRewardResponse> {
    try {
      // Fetch current streak data
      const currentStreak = await this.getArcadeStreak(uuid);

      // Check if this is a valid new claim
      const now = new Date();
      const lastClaimed = currentStreak.lastClaimed ? new Date(currentStreak.lastClaimed) : null;
      
      // Check if banner has changed since last claim
      const bannerChanged = currentStreak.lastBanner && 
      currentStreak.lastBanner !== this.rewardsConfig.name;
      
      // Get the server reset time for today (6:00 AM)
      const resetTime = new Date(now);
      resetTime.setHours(6, 0, 0, 0);
      
      // If claimed today after reset time, reject
      if (lastClaimed && this.isSameDay(lastClaimed, now) && lastClaimed >= resetTime) {
        return {
          success: false,
          rewardGiven: null,
          newStreak: currentStreak.streak,
          message: "You've already claimed your daily reward today."
        };
      }
      
      // Calculate new streak value
      let newStreak = currentStreak.streak;
      
      if (bannerChanged) {
        // If banner changed, reset streak to 1
        newStreak = 1;
        console.log(`Banner changed from ${currentStreak.lastBanner} to ${this.rewardsConfig.name}. Resetting streak.`);
      } else {
        newStreak += 1;
      }

      /*
      else if (!lastClaimed || this.isDayAfterReset(lastClaimed, now, resetTime)) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }*/
      
      // Calculate which day in the cycle we're on
      const dayInCycle = ((newStreak - 1) % this.rewardsConfig.totalDays) + 1;
      
      // Get reward from configuration
      const reward = this.getRewardForDay(dayInCycle);

      console.log(`Current streak: ${currentStreak.streak}, New streak: ${newStreak}, Reward: ${reward.amount} ${reward.type}`);
      
      // Update database
      await this.updateStreak(uuid, {
        lastClaimed: now,
        streak: newStreak,
        totalClaims: (currentStreak.totalClaims || 0) + 1,
        lastBanner: this.rewardsConfig.name
      });
      
      // Award the reward to player
      if (reward.type === "CURRENCY" && reward.amount > 0) {
        await this.awardCurrency(uuid, reward.amount);
      } else if (reward.type === "ITEM") {
        // Handle item rewards if needed
        console.log(`Item reward: ${reward.amount} of type ${reward.type}`);
      } else if(reward.type === "box") {
        this.giveLootbox(uuid, reward.description, reward.amount);
      }
      // Calculate next day's reward
      const nextDayInCycle = (dayInCycle % this.rewardsConfig.totalDays) + 1;
      const nextReward = this.getRewardForDay(nextDayInCycle);
      
      // Build response
      return {
        success: true,
        rewardGiven: reward,
        newStreak: newStreak,
        currentDay: dayInCycle,
        totalDays: this.rewardsConfig.totalDays,
        nextReward: nextReward,
        message: reward.description || this.getDefaultRewardMessage(dayInCycle),
        bannerName: this.rewardsConfig.name
      };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      throw error;
    }
  }
  
  private isDayAfterReset(previous: Date, current: Date, resetTime: Date): boolean {
    if (this.isSameDay(previous, current)) {
      const previousResetTime = new Date(previous);
      previousResetTime.setHours(6, 0, 0, 0);
      return previous < previousResetTime && current >= resetTime;
    }
    
    // Check if current is the next calendar day and after reset time
    const nextDay = new Date(previous);
    nextDay.setDate(nextDay.getDate() + 1);
    return this.isSameDay(nextDay, current) && current >= resetTime;
  }
  
  async getRewardsBanner(): Promise<DailyRewardsConfig> {
    try {
      return this.rewardsConfig;
    } catch (error) {
      console.error('Error getting rewards banner:', error);
      throw error;
    }
  }
  
  private getRewardForDay(day: number): DailyRewardItem {
    // Find the reward for the specific day
    const dayInCycle = ((day - 1) % this.rewardsConfig.totalDays) + 1;
    const rewardConfig = this.rewardsConfig.rewards.find(r => r.day === dayInCycle);
    
    // Return the configured reward or a default
    if (rewardConfig) {
      return rewardConfig;
    }
    
    // Fallback default reward if not found in config
    return { 
      day: dayInCycle, 
      type: "CURRENCY", 
      amount: 100,
      description: `Day ${dayInCycle} reward`
    };
  }
  
  private getDefaultRewardMessage(day: number): string {
    const dayInCycle = ((day - 1) % this.rewardsConfig.totalDays) + 1;
    
    if (dayInCycle === this.rewardsConfig.totalDays) {
      return `Congratulations! You've completed the ${this.rewardsConfig.totalDays}-day reward cycle!`;
    } else if (dayInCycle === 1) {
      return `You've started a new reward cycle! Come back tomorrow for more rewards!`;
    } else {
      return `Day ${dayInCycle} of ${this.rewardsConfig.totalDays} complete! Keep coming back for larger rewards!`;
    }
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
  }
  
  private async updateStreak(uuid: string, data: { 
    lastClaimed: Date, 
    streak: number, 
    totalClaims: number,
    lastBanner: string 
  }) {
    // Check if record exists
    const existing = await this.db.select({ id: smartRotomArcadeStreaks.id })
    .from(smartRotomArcadeStreaks)
    .where(eq(smartRotomArcadeStreaks.uuid, uuid))
    .execute();
    
    if (existing && existing.length > 0) {
      await this.db.update(smartRotomArcadeStreaks)
      .set(data as any)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid))
      .execute();
    } else {
      // Insert new record
      await this.db.insert(smartRotomArcadeStreaks)
      .values({ uuid, ...data })
      .execute();
    }
  }
  
  private async awardCurrency(uuid: string, amount: number) {
    try {
      // Use StarBank service to award currency
      const account = await this.starbankService.getMainAccount(uuid);
      if (!account) {
        throw new Error("No account found for user");
      }
      
      await this.starbankService.transaction(
        0, // From system
        account.id, // To player's account
        amount,
        "Daily bonus reward",
        "BONUS" 
      );
      
      console.log(`Awarded ${amount} currency to user ${uuid} for daily bonus`);
    } catch (error) {
      console.error('Error awarding currency:', error);
      throw error;
    }
  }
  
  async openLootBox(openLootBoxDto: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    try {
      const { uuid, boxId } = openLootBoxDto;
      console.log('Opening loot box for UUID:', uuid, 'Box ID:', boxId);
      
      // 1. Check that the box exists in config
      const boxConfig = lootboxConfig.boxes.find(box => box.id === boxId);
      if (!boxConfig) {
        throw new Error('Box not found');
      }
      
      // 2. Find the first available box of this type in the user's inventory
      const inventoryBoxes = await this.db.select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        amount: smartRotomInventory.amount,
        used: smartRotomInventory.used
      })
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, boxId),
        sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`
      ))
      .orderBy(smartRotomInventory.createdAt)
      .execute();
      
      // Check if user has any boxes available
      if (!inventoryBoxes || inventoryBoxes.length === 0) {
        throw new Error('No boxes available');
      }
      
      // Get the first box that can be used
      const boxToUse = inventoryBoxes[0];
      
      // 3. Increment the 'used' counter for this box item
      const newUsedCount = (boxToUse.used || 0) + 1;
      
      await this.db.update(smartRotomInventory)
      .set({ used: newUsedCount } as SmartRotomInventoryItem)
      .where(eq(smartRotomInventory.id, boxToUse.id))
      .execute();
      
      // 4. Select an item using the weight-based probability system
      // Calculate the total weight of all items
      const totalWeight = boxConfig.items.reduce((sum, item) => sum + item.weight, 0);
      
      // Generate a random number between 0 and the total weight
      const randomValue = Math.random() * totalWeight;
      
      // Find the item that corresponds to the random value
      let cumulativeWeight = 0;
      let selectedItem = boxConfig.items[0]; // Default to first item as fallback
      
      for (const item of boxConfig.items) {
        cumulativeWeight += item.weight;
        if (randomValue <= cumulativeWeight) {
          selectedItem = item;
          break;
        }
      }
      
      // Determine the rarity based on the weight
      const rarity = getRarityFromWeight(selectedItem.weight);
      
      // 5. Add the item to the player's inventory
      const newItemResult = await this.db.insert(smartRotomInventory)
      .values({
        uuid,
        itemId: selectedItem.id,
        itemType: rarity.toUpperCase(),
        amount: 1,
        sourceType: 'arcade',
        used: 0,
        rarity: rarity,
      } as SmartRotomInventoryItem)
      .execute();
      
      // Get the ID of the newly inserted item
      const newItemId = Number(newItemResult[0]?.insertId);

      console.log(`Item: {
        id: ${selectedItem.id},
        rarity: ${rarity},
        serverId: ${newItemId}
      }`);

      const spinnerItems = this.generateSpinnerItems(boxConfig.items, selectedItem);
      const winningPosition = spinnerItems.findIndex(
        item => item.id === selectedItem.id && item.isWinningItem
      );
      
      // 6. Return the result
      return {
        success: true,
        message: 'Successfully opened loot box',
        item: {
          id: selectedItem.id,
          rarity: rarity,
          serverId: newItemId
        },
        spinnerItems: spinnerItems,
        winningPosition: winningPosition,
      };
    } catch (error) {
      console.error('Error opening loot box:', error);
      throw error;
    }
  }

  private generateSpinnerItems(boxItems: any[], wonItem: any): any[] {
    // Generate a large array of items for a smooth animation
    const items = [];
    const totalItems = 300;
    
    // Insert winning item at a strategic position
    const winningPosition = totalItems - 15;
    
    for (let i = 0; i < totalItems; i++) {
      if (i === winningPosition) {
        // Insert the winning item and mark it
        items.push({
          ...wonItem,
          isWinningItem: true
        });
      } else {
        // Insert random items from the loot box
        const randomIndex = Math.floor(Math.random() * boxItems.length);
        items.push({
          ...boxItems[randomIndex],
          isWinningItem: false
        });
      }
    }
    
    return items;
  }
  
  
  async getInventory(uuid: string, sourceType?: string) {
    console.log('Fetching inventory for UUID:', uuid, 'with sourceType:', sourceType);
    try {
      // Build the query condition
      let condition = eq(smartRotomInventory.uuid, uuid);
      
      // If sourceType is provided, add it to the condition
      if (sourceType) {
        condition = and(condition, eq(smartRotomInventory.sourceType, sourceType));
      }
      
      // Get all inventory items
      const rawItems = await this.db.select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        itemType: smartRotomInventory.itemType,
        amount: smartRotomInventory.amount,
        sourceType: smartRotomInventory.sourceType,
        used: smartRotomInventory.used,
        rarity: smartRotomInventory.rarity,
        createdAt: smartRotomInventory.createdAt
      })
      .from(smartRotomInventory)
      .where(condition);
      
      // Aggregate items with the same itemId and combine their amounts/used counts
      const aggregatedItems = rawItems.reduce((acc, item) => {
        const consumableTypes = ['crate', 'consumable', 'potion', 'food'];
        const isConsumable = consumableTypes.includes(item.itemType);
        
        // For consumables, we group only by itemId and sourceType
        // For other items, we keep the original behavior with used status in the key
        const key = isConsumable
        ? `${item.itemId}_${item.sourceType || 'unknown'}`
        : `${item.itemId}_${item.used}_${item.sourceType || 'unknown'}`;
        
        if (!acc[key]) {
          // First occurrence of this item
          acc[key] = {
            ...item,
            // For consumables, track total amount and used amount separately
            totalAmount: isConsumable ? item.amount : item.amount,
            usedAmount: isConsumable ? (item.used || 0) : 0,
            // Store original IDs for reference (useful for claiming)
            originalIds: [item.id]
          };
        } else {
          // For consumables, sum both amount and used values
          if (isConsumable) {
            acc[key].totalAmount += item.amount;
            acc[key].usedAmount += (item.used || 0);
          } else {
            // Sum amounts for subsequent occurrences
            acc[key].amount += item.amount;
          }
          
          // Keep track of all IDs that make up this aggregated item
          acc[key].originalIds.push(item.id);
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Process the aggregated items to calculate remaining amounts for consumables
      for (const key in aggregatedItems) {
        const item = aggregatedItems[key];
        const consumableTypes = ['crate', 'consumable', 'potion', 'food'];
        
        if (consumableTypes.includes(item.itemType)) {
          // For consumables, calculate remaining amount and update amount field
          item.remainingAmount = item.totalAmount - item.usedAmount;
          item.amount = item.remainingAmount;
          
          // If fully consumed, mark as used=1 for backward compatibility
          item.used = item.remainingAmount > 0 ? 0 : 1;
        }
      }
      
      // Convert back to array
      const items = Object.values(aggregatedItems);
      
      // Group by item type for better organization
      const groupedItems = items.reduce((acc, item) => {
        const key = `${item.itemType}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      
      return {
        items: items,
        groupedItems: groupedItems,
        // Include the raw items as well for applications that need individual item details
        rawItems: rawItems
      };
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }
  
  async claimInventoryItems(uuid: string, itemIds: number[]) {
    try {
      // Verify the items belong to the user
      const items = await this.db.select({
        id: smartRotomInventory.id
      })
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        inArray(smartRotomInventory.id, itemIds),
        eq(smartRotomInventory.used, 0)
      ));
      
      // Get valid IDs (only those that match the user and are unused)
      const validIds = items.map(item => item.id);
      
      if (validIds.length === 0) {
        return {
          success: false,
          message: 'No valid items to claim',
          claimedIds: []
        };
      }
      
      // Update the items to mark as used
      await this.db.update(smartRotomInventory)
      .set({ used: 1 } as SmartRotomInventoryItem)
      .where(inArray(smartRotomInventory.id, validIds));
      
      return {
        success: true,
        message: `Successfully claimed ${validIds.length} items`,
        claimedIds: validIds
      };
    } catch (error) {
      console.error('Error claiming inventory items:', error);
      throw error;
    }
  }
  
  async addInventoryItem(data: {
    uuid: string;
    itemId: string;
    itemType: string;
    name: string;
    amount?: number;
    sourceType?: string;
    sourceId?: number;
  }) {
    try {
      const { uuid, itemId, itemType, name, amount = 1, sourceType = 'admin', sourceId } = data;
      
      // Validate user exists
      const user = await this.db.select({ id: smartrotomUsers.id })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);
      
      if (!user || user.length === 0) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Create inventory entry
      const result = await this.db.insert(smartRotomInventory).values({
        uuid,
        itemId,
        itemType,
        amount,
        sourceType,
        used: 0
      } as SmartRotomInventoryItem);
      
      return {
        success: true,
        message: 'Item added to inventory successfully',
        itemId: result[0].insertId
      };
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }
  
  async consumeInventoryItem(uuid: string, itemId: string) {
    try {
      // Find all instances of this item for the user, ordered by creation date (oldest first)
      const items = await this.db.select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        itemType: smartRotomInventory.itemType,
        amount: smartRotomInventory.amount,
        used: smartRotomInventory.used,
        createdAt: smartRotomInventory.createdAt
      })
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId),
        sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`
      ))
      .orderBy(smartRotomInventory.createdAt);
      
      if (!items || items.length === 0) {
        return {
          success: false,
          message: 'Item not found or already fully used',
          consumed: false
        };
      }
      
      // Get the oldest item that can still be used
      const currentItem = items[0];
      
      // Check if it's a consumable item type
      const consumableTypes = ['crate', 'consumable', 'potion', 'food'];
      if (!consumableTypes.includes(currentItem.itemType)) {
        return {
          success: false,
          message: 'This item cannot be consumed',
          consumed: false
        };
      }
      
      // Increment the "used" counter for this specific item
      const newUsedCount = (currentItem.used || 0) + 1;
      
      // Update the item to increment used count
      await this.db.update(smartRotomInventory)
      .set({ used: newUsedCount } as SmartRotomInventoryItem)
      .where(eq(smartRotomInventory.id, currentItem.id));
      
      // Get updated remaining amount
      const remainingAmount = currentItem.amount - newUsedCount;
      
      // Calculate total remaining across all instances of this item
      const totalRemaining = items.reduce((total, item) => {
        return total + (item.amount - (item.id === currentItem.id ? newUsedCount : (item.used || 0)));
      }, 0);
      
      return {
        success: true,
        message: `Successfully consumed ${currentItem.itemId}`,
        consumed: true,
        itemDetails: {
          ...currentItem,
          used: newUsedCount,
          remainingAmount,
          totalRemaining
        }
      };
    } catch (error) {
      console.error('Error consuming inventory item:', error);
      throw error;
    }
  }
  
  getLootboxConfig(): any {
    try {
      return {rarityRanges, lootboxConfig};
    } catch (error) {
      console.error('Error getting lootbox config:', error);
      throw error;
    }
  }

  async giveLootbox(uuid: string, boxId: string, amount: number) {
    try {
      const lootbox = lootboxConfig.boxes.find(box => box.id === boxId);
      if (!lootbox) {
        throw new Error('Lootbox not found');
      }
      
      // Add the lootbox to the user's inventory
      await this.db.insert(smartRotomInventory).values({
        uuid,
        itemId: boxId,
        itemType: 'lootbox',
        amount,
        sourceType: 'arcade',
        used: 0,
      } as SmartRotomInventoryItem).execute();
      
      return {
        success: true,
        message: `Successfully added ${amount} ${boxId} to inventory`,
      };
    } catch (error) {
      console.error('Error giving lootbox:', error);
      throw error;
    }
  }
}