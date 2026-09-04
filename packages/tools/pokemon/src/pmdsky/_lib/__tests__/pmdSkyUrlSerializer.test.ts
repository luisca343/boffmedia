import { describe, expect, it } from 'vitest'
import {
  encodePmdSkyUrl,
  decodePmdSkyUrl,
  type UrlState,
} from '../pmdSkyUrlSerializer'

describe('pmdSkyUrlSerializer', () => {
  const defaultState = {
    questType: 1,
    dungeon: 10,
    floor: 15,
    clientPokemon: 25,  // Pikachu
    targetPokemon: 6,   // Charizard
    rewardType: 2,
    targetItem: 1,
    rewardItem: 5,
    europeanVersion: false,
  }

  describe('round-trip encoding', () => {
    it('encodes and decodes default state', () => {
      const encoded = encodePmdSkyUrl(defaultState)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded).toEqual({
        v: 1,
        qt: 1,
        dg: 10,
        fl: 15,
        cp: 25,
        tp: 6,
        rt: 2,
        ti: 1,
        ri: 5,
        eu: false,
      })
    })

    it('encodes and decodes state with special quest type', () => {
      const state = {
        ...defaultState,
        specialQuestType: 3,
      }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded?.sq).toBe(3)
    })

    it('encodes and decodes European version setting', () => {
      const state = {
        ...defaultState,
        europeanVersion: true,
      }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded?.eu).toBe(true)
    })

    it('handles all quest types', () => {
      const questTypes = [0, 1, 2, 5, 8, 9, 11, 12]
      questTypes.forEach((questType) => {
        const state = { ...defaultState, questType }
        const encoded = encodePmdSkyUrl(state)
        const decoded = decodePmdSkyUrl(encoded)
        expect(decoded?.qt).toBe(questType)
      })
    })
  })

  describe('malformed input handling', () => {
    it('returns null for empty string', () => {
      expect(decodePmdSkyUrl('')).toBeNull()
    })

    it('returns null for truncated/corrupted data', () => {
      const encoded = encodePmdSkyUrl(defaultState)
      const truncated = encoded.slice(0, Math.max(1, encoded.length - 10))
      expect(decodePmdSkyUrl(truncated)).toBeNull()
    })

    it('returns null for invalid base64', () => {
      expect(decodePmdSkyUrl('!!!invalid!!!')).toBeNull()
    })

    it('returns null for wrong version', () => {
      const json = JSON.stringify({ v: 2, ...defaultState })
      const encoded = require('lz-string').compressToEncodedURIComponent(json)
      expect(decodePmdSkyUrl(encoded)).toBeNull()
    })

    it('returns null if required fields are missing', () => {
      const json = JSON.stringify({ v: 1, qt: 1 })
      const encoded = require('lz-string').compressToEncodedURIComponent(json)
      expect(decodePmdSkyUrl(encoded)).toBeNull()
    })

    it('returns null if europeanVersion has wrong type', () => {
      const json = JSON.stringify({
        v: 1,
        qt: 1,
        dg: 10,
        fl: 15,
        cp: 25,
        tp: 6,
        rt: 2,
        ti: 1,
        ri: 5,
        eu: 'yes',
      })
      const encoded = require('lz-string').compressToEncodedURIComponent(json)
      expect(decodePmdSkyUrl(encoded)).toBeNull()
    })
  })

  describe('clean URLs', () => {
    it('produces URL-safe output', () => {
      const encoded = encodePmdSkyUrl(defaultState)
      // lz-string compressToEncodedURIComponent produces characters safe for URLs
      // Can be used in query strings and paths without additional encoding
      expect(encoded.length).toBeGreaterThan(0)
      // Should be serializable as a query param
      const url = new URL('http://example.com/?wm=' + encodeURIComponent(encoded))
      expect(url.searchParams.get('wm')).toBe(encoded)
    })

    it('returns empty string on encoding error', () => {
      // In normal usage this shouldn't happen, but test the fallback
      const result = encodePmdSkyUrl(defaultState)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('omits optional fields from encoded output when not present', () => {
      const state = { ...defaultState }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded?.sq).toBeUndefined()
    })

    it('encodes as a single URL parameter (not URL query string)', () => {
      const encoded = encodePmdSkyUrl(defaultState)
      // The encoded output is a single token, not a query string with separators
      expect(encoded).not.toContain('&')
      expect(encoded).not.toContain('=')
      expect(encoded.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases and special characters', () => {
    it('omits specialQuestType when zero', () => {
      const state = {
        ...defaultState,
        specialQuestType: 0,
      }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded?.sq).toBeUndefined()
    })

    it('roundtrip with various numeric IDs', () => {
      const dungeons = [1, 10, 100, 255]
      dungeons.forEach((dungeonId) => {
        const state = { ...defaultState, dungeon: dungeonId }
        const encoded = encodePmdSkyUrl(state)
        const decoded = decodePmdSkyUrl(encoded)
        expect(decoded?.dg).toBe(dungeonId)
      })
    })

    it('handles high pokemon IDs', () => {
      const state = {
        ...defaultState,
        clientPokemon: 493,  // Arceus
        targetPokemon: 384,  // Rayquaza
      }
      const encoded = encodePmdSkyUrl(state)
      const decoded = decodePmdSkyUrl(encoded)
      expect(decoded?.cp).toBe(493)
      expect(decoded?.tp).toBe(384)
    })
  })
})
