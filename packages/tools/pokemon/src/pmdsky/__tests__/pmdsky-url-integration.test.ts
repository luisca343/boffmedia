import { describe, it, expect, vi } from 'vitest'
import { encodePmdSkyUrl, decodePmdSkyUrl } from '../_lib/pmdSkyUrlSerializer'

/**
 * Integration test: prove that URL state round-trips through encode/decode
 * with the actual types that PmdSkyView's form uses.
 *
 * This test validates that a share link generated from the current form state
 * can be decoded back to identical values that would re-hydrate the form.
 */
describe('PMD Sky URL round-trip integration', () => {
  // Simulate the form state that comes from useWmV3/store
  const formState = {
    questType: 1,
    specialQuestType: 0,
    dungeon: 10,
    floor: 5,
    clientPokemon: 25,  // Pikachu
    targetPokemon: 6,   // Charizard
    rewardType: 2,
    targetItem: 1,
    rewardItem: 15,
    europeanVersion: false,
  }

  it('encodes form state and decodes back to identical values', () => {
    // Step 1: encode (what PmdSkyView does when user clicks Copy Link)
    const encoded = encodePmdSkyUrl(formState)
    expect(encoded).toBeTruthy()
    expect(encoded.length).toBeGreaterThan(0)

    // Step 2: decode (what PmdSkyRouted does on mount)
    const decoded = decodePmdSkyUrl(encoded)
    expect(decoded).not.toBeNull()

    // Step 3: validate shape matches what form hydration needs
    expect(decoded).toMatchObject({
      v: 1,
      qt: formState.questType,
      dg: formState.dungeon,
      fl: formState.floor,
      cp: formState.clientPokemon,
      tp: formState.targetPokemon,
      rt: formState.rewardType,
      ti: formState.targetItem,
      ri: formState.rewardItem,
      eu: formState.europeanVersion,
    })
  })

  it('preserves special quest type when set', () => {
    const stateWithSpecial = {
      ...formState,
      specialQuestType: 3,
    }

    const encoded = encodePmdSkyUrl(stateWithSpecial)
    const decoded = decodePmdSkyUrl(encoded)

    expect(decoded?.sq).toBe(3)
  })

  it('omits specialQuestType from URL when it is 0 (default)', () => {
    const encoded = encodePmdSkyUrl(formState)
    const decoded = decodePmdSkyUrl(encoded)

    // Default value is omitted to keep URL short
    expect(decoded?.sq).toBeUndefined()
  })

  it('handles European version toggle', () => {
    const euState = {
      ...formState,
      europeanVersion: true,
    }

    const encoded = encodePmdSkyUrl(euState)
    const decoded = decodePmdSkyUrl(encoded)

    expect(decoded?.eu).toBe(true)
  })

  it('handles various dungeon and floor combinations', () => {
    const dungeonFloors = [
      { dungeon: 1, floor: 1 },
      { dungeon: 5, floor: 10 },
      { dungeon: 20, floor: 30 },
    ]

    dungeonFloors.forEach(({ dungeon, floor }) => {
      const state = { ...formState, dungeon, floor }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)

      expect(decoded?.dg).toBe(dungeon)
      expect(decoded?.fl).toBe(floor)
    })
  })

  it('handles all pokemon ID ranges (0-493)', () => {
    const pokemonIds = [0, 1, 25, 150, 250, 384, 493]

    pokemonIds.forEach((id) => {
      const state = { ...formState, clientPokemon: id }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)

      expect(decoded?.cp).toBe(id)
    })
  })

  it('malformed URL fails cleanly without corrupting state', () => {
    // Truncated URL
    const encoded = encodePmdSkyUrl(formState)
    const truncated = encoded.slice(0, Math.max(1, encoded.length - 10))
    const decoded = decodePmdSkyUrl(truncated)

    // Should fail gracefully
    expect(decoded).toBeNull()

    // This means PmdSkyRouted.onHydrateFromUrl will not apply any state,
    // and the form will show default values instead of corrupted ones
  })

  it('user can share form state via URL and another user receives identical state', () => {
    // User A: creates a specific build
    const userAState = {
      questType: 5,
      specialQuestType: 2,
      dungeon: 15,
      floor: 20,
      clientPokemon: 150,
      targetPokemon: 248,
      rewardType: 3,
      targetItem: 5,
      rewardItem: 10,
      europeanVersion: true,
    }

    // User A: generates share link
    const encoded = encodePmdSkyUrl(userAState)

    // [Network transmission: URL is shared]

    // User B: receives and decodes the link
    const userBState = decodePmdSkyUrl(encoded)

    // User B gets User A's exact state
    expect(userBState).toMatchObject({
      v: 1,
      qt: userAState.questType,
      sq: userAState.specialQuestType,
      dg: userAState.dungeon,
      fl: userAState.floor,
      cp: userAState.clientPokemon,
      tp: userAState.targetPokemon,
      rt: userAState.rewardType,
      ti: userAState.targetItem,
      ri: userAState.rewardItem,
      eu: userAState.europeanVersion,
    })
  })
})
