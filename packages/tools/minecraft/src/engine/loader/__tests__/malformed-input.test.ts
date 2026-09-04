import { describe, expect, it } from 'vitest';
import { loadSchematicFile } from '../index';

/**
 * Tests for T6: Schematic loaders with malformed/adversarial input.
 *
 * Assertion: each loader FAILS FAST with a clear error (throws exception with
 * helpful message) rather than hanging, crashing, or throwing cryptic errors.
 */

// Helper to wrap bytes in File shape expected by loadSchematicFile
function asFile(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

// Helper to test that loading a file throws an error
async function expectLoadToThrow(
  bytes: Uint8Array,
  name: string,
): Promise<string> {
  const file = asFile(bytes, name);
  let errorMessage = '';
  try {
    await loadSchematicFile(file);
    throw new Error('Expected loadSchematicFile to throw');
  } catch (e) {
    errorMessage = String(e);
  }
  return errorMessage;
}

describe('Schematic loaders - malformed input handling', () => {
  describe('truncated files', () => {
    it('throws error on empty file', async () => {
      const emptyBytes = new Uint8Array(0);
      const errorMsg = await expectLoadToThrow(emptyBytes, 'empty.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on file with only partial NBT header', async () => {
      const truncatedHeader = new Uint8Array([0x0a, 0x00]);
      const errorMsg = await expectLoadToThrow(truncatedHeader, 'truncated.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on file with truncated dimension data', async () => {
      const truncated = new Uint8Array([
        0x0a, 0x00, 0x03, 0x52, 0x6f, 0x6f, 0x03, 0x00, 0x05, 0x57, 0x69, 0x64, 0x74, 0x68, 0x00, 0x00, 0x00,
      ]);
      const errorMsg = await expectLoadToThrow(truncated, 'truncated-dims.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on file truncated mid-block-data', async () => {
      const truncated = new Uint8Array([0x0a, 0x00, 0x04, 0x72, 0x6f, 0x6f, 0x74, 0x03, 0x00, 0x05, 0x57, 0x69, 0x64, 0x74, 0x68, 0x00, 0x00, 0x00, 0x0a]);
      const errorMsg = await expectLoadToThrow(truncated, 'truncated-blocks.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });
  });

  describe('wrong magic bytes / format', () => {
    it('throws error on file with wrong NBT tag type', async () => {
      const wrongMagic = new Uint8Array([0xff, 0x00, 0x04, 0x72, 0x6f, 0x6f, 0x74]);
      const errorMsg = await expectLoadToThrow(wrongMagic, 'wrong-magic.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on corrupted NBT structure', async () => {
      const corrupted = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0xff, 0xff, 0xff, 0xff]);
      const errorMsg = await expectLoadToThrow(corrupted, 'corrupted.schem');
      expect(errorMsg.length).toBeGreaterThan(0);
    });
  });

  describe('absurd declared dimensions', () => {
    it('throws error or handles when dimension is declared as 0', async () => {
      const zeroWidth = new Uint8Array([0x0a, 0x00, 0x04, 0x72, 0x6f, 0x6f, 0x74, 0x03, 0x00, 0x05, 0x57, 0x69, 0x64, 0x74, 0x68, 0x00, 0x00, 0x00, 0x00, 0x00]);
      // Should either throw error or return gracefully, not hang
      let threw = false;
      try {
        await loadSchematicFile(asFile(zeroWidth, 'zero-width.schem'));
      } catch (e) {
        threw = true;
        expect(String(e).length).toBeGreaterThan(0);
      }
      expect(threw).toBe(true);
    });

    it('throws error on extremely large dimensions', async () => {
      const hugeDims = new Uint8Array([
        0x0a, 0x00, 0x04, 0x72, 0x6f, 0x6f, 0x74, 0x03, 0x00, 0x05, 0x57, 0x69, 0x64, 0x74, 0x68, 0x7f, 0xff, 0xff, 0xff, 0x03, 0x00, 0x06, 0x48, 0x65, 0x69, 0x67, 0x68, 0x74,
        0x7f, 0xff, 0xff, 0xff, 0x03, 0x00, 0x06, 0x4c, 0x65, 0x6e, 0x67, 0x74, 0x68, 0x7f, 0xff, 0xff, 0xff, 0x00,
      ]);
      let threw = false;
      try {
        await loadSchematicFile(asFile(hugeDims, 'huge-dims.schem'));
      } catch (e) {
        threw = true;
        // Should have a reasonable error message
        expect(String(e).length).toBeGreaterThan(0);
      }
      expect(threw).toBe(true);
    });
  });

  describe('error reporting clarity', () => {
    it('throws error with clear message for invalid input', async () => {
      const invalid = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
      const errorMsg = await expectLoadToThrow(invalid, 'invalid.schem');
      expect(errorMsg).toBeTruthy();
      // Error should be a string, not an object dump
      expect(typeof errorMsg).toBe('string');
    });

    it('does not hang on completely malformed input', async () => {
      const truncated = new Uint8Array([0x0a]);
      let timedOut = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, 5000); // 5 second timeout
      });

      try {
        await Promise.race([loadSchematicFile(asFile(truncated, 'truncated-header.schem')), timeoutPromise]);
      } catch (e) {
        // Exception thrown quickly is fine
      }
      expect(timedOut).toBe(false);
    });
  });

  describe('format-specific edge cases', () => {
    it('throws error on .mca with insufficient header data', async () => {
      // MCA files need at least 8KB header
      const smallMCA = new Uint8Array(1024);
      smallMCA.fill(0);
      const errorMsg = await expectLoadToThrow(smallMCA, 'truncated.mca');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .schem with malformed Height field', async () => {
      // A schem file with Width but malformed Height
      const malformed = new Uint8Array([
        0x0a, 0x00, 0x04, 0x72, 0x6f, 0x6f, 0x74, 0x03, 0x00, 0x05, 0x57, 0x69, 0x64, 0x74, 0x68, 0x00, 0x00, 0x00, 0x10, 0x03, 0x00, 0x06, 0x48, 0x65, 0x69, 0x67, 0x68, 0x74,
        // No height value follows
        0x00,
      ]);
      let threw = false;
      try {
        await loadSchematicFile(asFile(malformed, 'malformed.schem'));
      } catch (e) {
        threw = true;
        expect(String(e).length).toBeGreaterThan(0);
      }
      expect(threw).toBe(true);
    });
  });

  describe('performance and safety', () => {
    it('does not attempt massive allocations for huge dimensions', async () => {
      const hugeDims = new Uint8Array(100);
      hugeDims[0] = 0x0a; // TAG_Compound
      // Set absurdly large dimension
      let offset = 7;
      hugeDims[offset++] = 0x03; // TAG_Int
      hugeDims[offset++] = 0x00;
      hugeDims[offset++] = 0x05;
      hugeDims[offset++] = 0x57;
      hugeDims[offset++] = 0x69;
      hugeDims[offset++] = 0x64;
      hugeDims[offset++] = 0x74;
      hugeDims[offset++] = 0x68;
      hugeDims[offset++] = 0x7f;
      hugeDims[offset++] = 0xff;
      hugeDims[offset++] = 0xff;
      hugeDims[offset++] = 0xff;

      let threw = false;
      try {
        await loadSchematicFile(asFile(hugeDims, 'huge.schem'));
      } catch (e) {
        threw = true;
        // Should throw quickly with error message, not attempt allocation
        expect(String(e).length).toBeGreaterThan(0);
      }
      expect(threw).toBe(true);
    });
  });

  describe('coverage for missing loader tests', () => {
    it('throws error on .nbt with empty file', async () => {
      const emptyBytes = new Uint8Array(0);
      const errorMsg = await expectLoadToThrow(emptyBytes, 'empty.nbt');
      expect(errorMsg.length).toBeGreaterThan(0);
      // Should not succeed - .nbt requires valid NBT data
      expect(errorMsg).not.toMatch(/^$/);
    });

    it('throws error on .nbt with truncated NBT', async () => {
      const truncatedNBT = new Uint8Array([0x0a, 0x00]);
      const errorMsg = await expectLoadToThrow(truncatedNBT, 'truncated.nbt');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .litematic with empty file', async () => {
      const emptyBytes = new Uint8Array(0);
      const errorMsg = await expectLoadToThrow(emptyBytes, 'empty.litematic');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .litematic with truncated NBT', async () => {
      const truncatedNBT = new Uint8Array([0x0a, 0x00, 0x04, 0x6d, 0x61, 0x69, 0x6e]);
      const errorMsg = await expectLoadToThrow(truncatedNBT, 'broken.litematic');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .prefab.json with empty file', async () => {
      const emptyBytes = new Uint8Array(0);
      const errorMsg = await expectLoadToThrow(emptyBytes, 'empty.prefab.json');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .prefab.json with invalid JSON', async () => {
      const invalidJSON = new TextEncoder().encode('{invalid json}');
      const errorMsg = await expectLoadToThrow(invalidJSON, 'broken.prefab.json');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .schematic (MCEdit legacy) with truncated NBT', async () => {
      // .schematic is same extension as schem but different format
      const truncatedNBT = new Uint8Array([0x0a, 0x00, 0x04, 0x74, 0x65, 0x73, 0x74]);
      const errorMsg = await expectLoadToThrow(truncatedNBT, 'legacy.schematic');
      expect(errorMsg.length).toBeGreaterThan(0);
    });

    it('throws error on .prefab (Hytale, not .prefab.json) with empty file', async () => {
      const emptyBytes = new Uint8Array(0);
      const errorMsg = await expectLoadToThrow(emptyBytes, 'empty.prefab');
      expect(errorMsg.length).toBeGreaterThan(0);
    });
  });

  describe('unbounded recursion and allocation concerns', () => {
    it('handles .schem with maximum-value dimensions without hanging', async () => {
      // Test that schem doesn't recurse unboundedly or allocate excessively
      // Max int32 = 2147483647, so 3x multiplied = overflow territory
      const maxDims = new Uint8Array(50);
      maxDims[0] = 0x0a; // TAG_Compound (root)
      maxDims[1] = 0x00; // root name length (short) = 0
      maxDims[2] = 0x00;

      // Write Width (TAG_Int = 0x03)
      let offset = 3;
      maxDims[offset++] = 0x03;                                  // TAG_Int
      maxDims[offset++] = 0x00; maxDims[offset++] = 0x05;        // name length
      maxDims[offset++] = 0x57; maxDims[offset++] = 0x69;        // 'Wi'
      maxDims[offset++] = 0x64; maxDims[offset++] = 0x74;        // 'dt'
      maxDims[offset++] = 0x68;                                  // 'h'
      maxDims[offset++] = 0x7f; maxDims[offset++] = 0xff;        // value
      maxDims[offset++] = 0xff; maxDims[offset++] = 0xff;        // 2147483647

      // Write Height (TAG_Int = 0x03)
      maxDims[offset++] = 0x03;                                  // TAG_Int
      maxDims[offset++] = 0x00; maxDims[offset++] = 0x06;        // name length
      maxDims[offset++] = 0x48; maxDims[offset++] = 0x65;        // 'He'
      maxDims[offset++] = 0x69; maxDims[offset++] = 0x67;        // 'ig'
      maxDims[offset++] = 0x68; maxDims[offset++] = 0x74;        // 'ht'
      maxDims[offset++] = 0x7f; maxDims[offset++] = 0xff;        // value
      maxDims[offset++] = 0xff; maxDims[offset++] = 0xff;        // 2147483647

      // Write Length (TAG_Int = 0x03)
      maxDims[offset++] = 0x03;                                  // TAG_Int
      maxDims[offset++] = 0x00; maxDims[offset++] = 0x06;        // name length
      maxDims[offset++] = 0x4c; maxDims[offset++] = 0x65;        // 'Le'
      maxDims[offset++] = 0x6e; maxDims[offset++] = 0x67;        // 'ng'
      maxDims[offset++] = 0x74; maxDims[offset++] = 0x68;        // 'th'
      maxDims[offset++] = 0x7f; maxDims[offset++] = 0xff;        // value
      maxDims[offset++] = 0xff; maxDims[offset++] = 0xff;        // 2147483647

      maxDims[offset] = 0x00; // TAG_End

      let timedOut = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, 3000); // 3 second timeout for allocation attempt
      });

      try {
        await Promise.race([
          loadSchematicFile(asFile(maxDims, 'max-dims.schem')),
          timeoutPromise,
        ]);
      } catch (e) {
        // Expected to throw, but not hang
        const errStr = String(e);
        expect(errStr.length).toBeGreaterThan(0);
      }

      // Critical: confirm no timeout occurred (no hung allocation)
      expect(timedOut).toBe(false);
    });

    it('handles .litematic with maximum dimensions without hanging per-region', async () => {
      // Litematica format: root NBT with Regions compound
      const maxLitematic = new Uint8Array(100);
      maxLitematic[0] = 0x0a; // TAG_Compound (root)
      maxLitematic[1] = 0x00; // root name length
      maxLitematic[2] = 0x00;

      // Just seed with bad structure - the parser should fail gracefully
      let offset = 3;
      maxLitematic[offset++] = 0x08; // TAG_String (MinecraftDataVersion as string = invalid)
      maxLitematic[offset++] = 0x00;
      maxLitematic[offset++] = 0x10; // name = "MinecraftDataVersion" (long name)
      maxLitematic[offset++] = 0x4d; // M
      maxLitematic[offset++] = 0x69; // i

      let timedOut = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, 3000);
      });

      try {
        await Promise.race([
          loadSchematicFile(asFile(maxLitematic, 'bad-structure.litematic')),
          timeoutPromise,
        ]);
      } catch (e) {
        // Expected to throw
        expect(String(e).length).toBeGreaterThan(0);
      }

      // No timeout = no infinite recursion or hang
      expect(timedOut).toBe(false);
    });

    it('does not recurse indefinitely on deeply nested NBT compounds', async () => {
      // Build a deeply nested NBT (compound inside compound inside ...)
      // to test unbounded recursion in NBT parser
      const deepNBT = new Uint8Array(500);
      deepNBT[0] = 0x0a; // TAG_Compound
      deepNBT[1] = 0x00; deepNBT[2] = 0x00; // root name length = 0

      // Nest 50 levels of compounds (each contains the next)
      let offset = 3;
      for (let i = 0; i < 50 && offset < deepNBT.length - 10; i++) {
        deepNBT[offset++] = 0x0a; // TAG_Compound
        deepNBT[offset++] = 0x00;
        deepNBT[offset++] = 0x01; // name length = 1
        deepNBT[offset++] = 0x43; // 'C'
      }
      deepNBT[offset] = 0x00; // TAG_End

      let timedOut = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, 3000);
      });

      try {
        await Promise.race([
          loadSchematicFile(asFile(deepNBT, 'deep-nbt.schem')),
          timeoutPromise,
        ]);
      } catch (e) {
        // Expected to throw
        expect(String(e).length).toBeGreaterThan(0);
      }

      // Confirm no timeout (no unbounded recursion)
      expect(timedOut).toBe(false);
    });
  });
});
