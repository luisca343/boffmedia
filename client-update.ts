// ==================== REVERTED TYPES FOR CLIENT-SIDE ====================

// Add these types to your client-side types or import them from generated API
export interface ClaimItemsDto {
  uuid: string;
  itemIds: string[]; // Back to string[] for item IDs
}

export interface ClaimItemsResponseDto {
  claimedItems: string[]; // Item IDs of successfully claimed items
  failedItems: string[];  // Item IDs of failed items
  pokemonItems: string[]; // Item IDs of Pokemon given to player
  regularItems: string[]; // Item IDs of regular items given to player
  success: boolean;
  message: string;
}

// ==================== UPDATED METHOD FOR ArcadeService CLASS ====================

/**
 * Claim multiple items from inventory and give them to player in-game
 */
static claimItems(claimItemsDto: ClaimItemsDto): Promise<ApiResponse<ClaimItemsResponseDto>> {
  return rotomPOST<ClaimItemsResponseDto>('/arcade/claim-items', claimItemsDto);
}

// ==================== UPDATED CONVENIENCE METHOD ====================

/**
 * Quick claim items (convenience method)
 */
static quickClaimItems(uuid: string, itemIds: string[]): Promise<ApiResponse<ClaimItemsResponseDto>> {
  return ArcadeService.claimItems({ uuid, itemIds });
}

// ==================== USAGE EXAMPLE ====================

/*
// Example of how to use the endpoint with item IDs (reverted back)
const response = await ArcadeService.claimItems({
  uuid: 'player-uuid-here',
  itemIds: ['pixelmon:master_ball', 'pokeball_item', 'pikachu_pokemon'] // Item IDs from inventory
});

if (response.success) {
  const result = response.data;
  console.log('Claimed items (Item IDs):', result.claimedItems);
  console.log('Pokemon given (item IDs):', result.pokemonItems);
  console.log('Regular items given (item IDs):', result.regularItems);
  console.log('Failed items (Item IDs):', result.failedItems);
  console.log('Message:', result.message);
}

// Or using the convenience method:
const response2 = await ArcadeService.quickClaimItems(
  'player-uuid-here', 
  ['item1', 'item2', 'item3']
);
*/
