import { Injectable } from '@nestjs/common';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from '../dto/lottbox.dto';
import { lootboxConfig, getRarityFromWeight } from '../_config/lootboxConfig';
import { ArcadeRepository } from '@repositories/smartrotom/arcade.repository';

@Injectable()
export class LootboxService {
  constructor(
    private readonly arcadeRepository: ArcadeRepository,
  ) {}

  async openLootBox(openLootBoxDto: OpenLootBoxDto): Promise<OpenLootBoxResponseDto> {
    const { uuid, boxId } = openLootBoxDto;
    
    // Check box configuration
    const boxConfig = lootboxConfig.boxes.find(box => box.id === boxId);
    if (!boxConfig) {
      throw new Error('Box not found');
    }
    
    // Find available boxes
    const inventoryBoxes = await this.arcadeRepository.findAvailableBoxes(uuid, boxId);
    
    if (!inventoryBoxes || inventoryBoxes.length === 0) {
      throw new Error('No boxes available');
    }
    
    const boxToUse = inventoryBoxes[0];
    const newUsedCount = (boxToUse.used || 0) + 1;
    
    // Update box usage
    await this.arcadeRepository.updateInventoryItemUsage(boxToUse.id, newUsedCount);
    
    // Select random item
    const selectedItem = this.selectRandomItem(boxConfig.items);
    const rarity = getRarityFromWeight(selectedItem.weight);
    
    // Add item to inventory
    const newItemResult = await this.arcadeRepository.addInventoryItem({
      uuid,
      itemId: selectedItem.id,
      itemType: rarity.toUpperCase(),
      amount: 1,
      sourceType: 'arcade',
      used: 0,
      rarity: rarity,
    });
    
    const newItemId = Number(newItemResult[0]?.insertId);
    
    // Generate spinner animation data
    const spinnerItems = this.generateSpinnerItems(boxConfig.items, selectedItem);
    const winningPosition = spinnerItems.findIndex(
      item => item.id === selectedItem.id && item.isWinningItem
    );
    
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
  }

  async giveLootbox(uuid: string, boxId: string, amount: number = 1) {
    const lootbox = lootboxConfig.boxes.find(box => box.id === boxId);
    if (!lootbox) {
      throw new Error('Lootbox not found');
    }
    
    await this.arcadeRepository.addInventoryItem({
      uuid,
      itemId: boxId,
      itemType: 'lootbox',
      amount,
      sourceType: 'arcade',
      used: 0,
    });
    
    return {
      success: true,
      message: `Successfully added ${amount} ${boxId} to inventory`,
    };
  }

  getLootboxConfig() {
    return lootboxConfig;
  }

  private selectRandomItem(items: any[]) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const randomValue = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    for (const item of items) {
      cumulativeWeight += item.weight;
      if (randomValue <= cumulativeWeight) {
        return item;
      }
    }
    
    return items[0]; // Fallback
  }

  private generateSpinnerItems(boxItems: any[], wonItem: any): any[] {
    const items = [];
    const totalItems = 300;
    const winningPosition = totalItems - 15;
    
    for (let i = 0; i < totalItems; i++) {
      if (i === winningPosition) {
        items.push({
          ...wonItem,
          isWinningItem: true
        });
      } else {
        const randomIndex = Math.floor(Math.random() * boxItems.length);
        items.push({
          ...boxItems[randomIndex],
          isWinningItem: false
        });
      }
    }
    
    return items;
  }
}