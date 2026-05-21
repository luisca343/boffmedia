import { Injectable, Inject } from '@nestjs/common';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from '../dto/lottbox.dto';
import {
  lootboxConfig,
  getRarityFromWeight,
  rarityRanges,
} from '../_config/lootboxConfig';
import { ARCADE_INVENTORY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IArcadeInventoryRepository } from '../repositories/interfaces/arcade-inventory.repository.interface';
import {
  LootboxBoxesCollection,
  LootboxConfigEntity,
  LootboxItemConfig,
} from '../entities/lootbox-config.entity';

@Injectable()
export class LootboxService {
  constructor(
    @Inject(ARCADE_INVENTORY_REPOSITORY_TOKEN)
    private readonly arcadeInventoryRepository: IArcadeInventoryRepository,
  ) {}

  async openLootBox(
    openLootBoxDto: OpenLootBoxDto,
  ): Promise<OpenLootBoxResponseDto> {
    const { uuid, boxId } = openLootBoxDto;

    // Check box configuration
    const boxConfig = lootboxConfig.boxes.find((box) => box.id === boxId);
    if (!boxConfig) {
      throw new Error('Box not found');
    }

    // Find available boxes using the new repository
    const inventoryBoxes = await this.arcadeInventoryRepository.findUserItem(
      uuid,
      boxId,
    );

    if (!inventoryBoxes || inventoryBoxes.amount <= 0) {
      throw new Error('No boxes available');
    }

    // Consume one box
    await this.arcadeInventoryRepository.consumeItem(uuid, boxId, 1);

    // Select random item
    const selectedItem = this.selectRandomItem(boxConfig.items);
    const rarity = getRarityFromWeight(selectedItem.weight);

    // Add item to inventory using new repository
    const _newItemResult = await this.arcadeInventoryRepository.addItem({
      uuid,
      itemId: selectedItem.id,
      itemData: selectedItem.data ?? undefined,
      itemType: selectedItem.type || 'lootbox_item',
      amount: selectedItem.amount || 1,
      sourceType: 'arcade',
      used: 0,
      rarity: rarity,
    });

    // Generate spinner animation data
    const spinnerItems = this.generateSpinnerItems(
      boxConfig.items,
      selectedItem,
    );
    const winningPosition = spinnerItems.findIndex(
      (item) => item.id === selectedItem.id && item.isWinningItem,
    );

    return {
      item: {
        ...selectedItem,
        rarity: rarity,
      },
      spinnerItems: spinnerItems,
      winningPosition: winningPosition,
    };
  }

  async giveLootbox(uuid: string, boxId: string, amount: number = 1) {
    const lootbox = lootboxConfig.boxes.find((box) => box.id === boxId);
    if (!lootbox) {
      throw new Error('Lootbox not found');
    }

    await this.arcadeInventoryRepository.addItem({
      uuid,
      itemId: boxId,
      itemData: undefined, // Lootboxes don't have itemData
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

  getLootboxConfig(): LootboxConfigEntity {
    // Transform the raw config into our entity structure
    const formattedBoxes = lootboxConfig.boxes.map((box) => ({
      id: box.id,
      name: box.name,
      image: box.image,
      description: box.description,
      items: box.items,
      theme: box.theme,
    }));

    const boxesCollection = new LootboxBoxesCollection();
    boxesCollection.boxes = formattedBoxes;

    const configEntity = new LootboxConfigEntity();
    configEntity.rarityRanges = rarityRanges;
    configEntity.lootboxConfig = boxesCollection;

    return configEntity;
  }

  private selectRandomItem(items: LootboxItemConfig[]) {
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
          isWinningItem: true,
        });
      } else {
        const randomIndex = Math.floor(Math.random() * boxItems.length);
        items.push({
          ...boxItems[randomIndex],
          isWinningItem: false,
        });
      }
    }

    return items;
  }
}
