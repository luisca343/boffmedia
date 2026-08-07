//! Romhack patching (§4.1). Applies a `.bps` or `.ups` patch to a clean base
//! ROM entirely in Rust — small, well-specified formats, no external dependency.
//! Both formats embed source/target/patch CRC32s, so we get integrity checks for
//! free: a base that is the wrong revision, a corrupt patch, or an output that
//! does not match what the manifest pinned are all caught here with distinct
//! errors. `.ips` is deliberately unsupported (no embedded checksums).
//!
//! References: the BPS and UPS format specifications (byuu). The number encoding
//! ("VLE") is shared by both.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PatchFormat {
    Bps,
    Ups,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum PatchError {
    #[error("patch is not a valid {0} file (bad magic or truncated)")]
    Malformed(&'static str),
    #[error("the patch ran past the end of its data")]
    Truncated,
    #[error("an offset in the patch points outside the file")]
    OffsetOutOfRange,
    #[error("unknown patch command")]
    BadCommand,
    #[error("your dump is not the revision this patch expects (source CRC32 mismatch)")]
    SourceCrcMismatch,
    #[error("the patch file itself is corrupt (patch CRC32 mismatch)")]
    PatchCrcMismatch,
    #[error("the patched result does not match the patch's own target CRC32")]
    OutputCrcMismatch,
    #[error("the patched result has the wrong size")]
    OutputSizeMismatch,
}

/// Apply `patch` to `base`, returning the patched bytes. The result is NOT yet
/// checked against the manifest's pinned sha512 — that happens in the file
/// pipeline, uniformly with every other file.
pub fn apply(format: PatchFormat, base: &[u8], patch: &[u8]) -> Result<Vec<u8>, PatchError> {
    match format {
        PatchFormat::Bps => apply_bps(base, patch),
        PatchFormat::Ups => apply_ups(base, patch),
    }
}

/// CRC32 (IEEE, poly 0xEDB88320) — the checksum both formats embed.
pub fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            crc = if crc & 1 != 0 {
                (crc >> 1) ^ 0xEDB8_8320
            } else {
                crc >> 1
            };
        }
    }
    !crc
}

/// A byte cursor with the shared BPS/UPS variable-length number decoder.
struct Cursor<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> Cursor<'a> {
    fn new(buf: &'a [u8], pos: usize) -> Self {
        Self { buf, pos }
    }

    fn read_u8(&mut self) -> Result<u8, PatchError> {
        let b = *self.buf.get(self.pos).ok_or(PatchError::Truncated)?;
        self.pos += 1;
        Ok(b)
    }

    /// The BPS/UPS variable-length number encoding.
    fn read_vle(&mut self) -> Result<u64, PatchError> {
        let mut value: u64 = 0;
        let mut shift: u64 = 1;
        loop {
            let x = self.read_u8()?;
            value = value.wrapping_add((x as u64 & 0x7f).wrapping_mul(shift));
            if x & 0x80 != 0 {
                break;
            }
            shift <<= 7;
            value = value.wrapping_add(shift);
        }
        Ok(value)
    }
}

fn le_u32(buf: &[u8], at: usize) -> u32 {
    u32::from_le_bytes([buf[at], buf[at + 1], buf[at + 2], buf[at + 3]])
}

fn apply_bps(source: &[u8], patch: &[u8]) -> Result<Vec<u8>, PatchError> {
    if patch.len() < 4 + 12 || &patch[0..4] != b"BPS1" {
        return Err(PatchError::Malformed("BPS"));
    }
    let body_end = patch.len() - 12; // the last 12 bytes are three CRC32s

    let mut c = Cursor::new(patch, 4);
    let source_size = c.read_vle()? as usize;
    let target_size = c.read_vle()? as usize;
    let metadata_size = c.read_vle()? as usize;
    c.pos = c.pos.checked_add(metadata_size).ok_or(PatchError::Truncated)?;
    if c.pos > body_end {
        return Err(PatchError::Truncated);
    }
    if source.len() != source_size {
        return Err(PatchError::SourceCrcMismatch);
    }

    let mut out: Vec<u8> = Vec::with_capacity(target_size);
    let mut source_rel: i64 = 0;
    let mut target_rel: i64 = 0;

    while c.pos < body_end {
        let data = c.read_vle()?;
        let command = data & 3;
        let length = (data >> 2) as usize + 1;
        match command {
            0 => {
                // SourceRead: copy `length` bytes from source at the current
                // output offset.
                for _ in 0..length {
                    let idx = out.len();
                    out.push(*source.get(idx).ok_or(PatchError::OffsetOutOfRange)?);
                }
            }
            1 => {
                // TargetRead: copy `length` bytes straight from the patch stream.
                for _ in 0..length {
                    out.push(c.read_u8()?);
                }
            }
            2 => {
                // SourceCopy: a signed relative seek into the source, then copy.
                source_rel += signed_offset(c.read_vle()?);
                for _ in 0..length {
                    let idx = usize::try_from(source_rel).map_err(|_| PatchError::OffsetOutOfRange)?;
                    out.push(*source.get(idx).ok_or(PatchError::OffsetOutOfRange)?);
                    source_rel += 1;
                }
            }
            3 => {
                // TargetCopy: a signed relative seek into the ALREADY-written
                // output, then copy (supports RLE-style overlapping runs).
                target_rel += signed_offset(c.read_vle()?);
                for _ in 0..length {
                    let idx = usize::try_from(target_rel).map_err(|_| PatchError::OffsetOutOfRange)?;
                    let byte = *out.get(idx).ok_or(PatchError::OffsetOutOfRange)?;
                    out.push(byte);
                    target_rel += 1;
                }
            }
            _ => return Err(PatchError::BadCommand),
        }
    }

    if out.len() != target_size {
        return Err(PatchError::OutputSizeMismatch);
    }

    // Footer CRCs: source, target, patch (each little-endian).
    if crc32(source) != le_u32(patch, body_end) {
        return Err(PatchError::SourceCrcMismatch);
    }
    // The patch CRC covers the whole file except its own trailing 4 bytes.
    if crc32(&patch[..patch.len() - 4]) != le_u32(patch, body_end + 8) {
        return Err(PatchError::PatchCrcMismatch);
    }
    if crc32(&out) != le_u32(patch, body_end + 4) {
        return Err(PatchError::OutputCrcMismatch);
    }
    Ok(out)
}

/// BPS/UPS copy offsets are a magnitude with the sign in the low bit.
fn signed_offset(data: u64) -> i64 {
    let magnitude = (data >> 1) as i64;
    if data & 1 != 0 {
        -magnitude
    } else {
        magnitude
    }
}

fn apply_ups(source: &[u8], patch: &[u8]) -> Result<Vec<u8>, PatchError> {
    if patch.len() < 4 + 12 || &patch[0..4] != b"UPS1" {
        return Err(PatchError::Malformed("UPS"));
    }
    let body_end = patch.len() - 12;

    let mut c = Cursor::new(patch, 4);
    let in_size = c.read_vle()? as usize;
    let out_size = c.read_vle()? as usize;
    if source.len() != in_size {
        return Err(PatchError::SourceCrcMismatch);
    }

    // The output starts as the source (truncated/zero-extended to out_size); the
    // patch then XORs difference bytes over it.
    let mut out = vec![0u8; out_size];
    let copy = source.len().min(out_size);
    out[..copy].copy_from_slice(&source[..copy]);

    let mut pos: usize = 0;
    while c.pos < body_end {
        pos = pos
            .checked_add(c.read_vle()? as usize)
            .ok_or(PatchError::OffsetOutOfRange)?;
        loop {
            let x = c.read_u8()?;
            if pos < out.len() {
                out[pos] ^= x;
            }
            pos += 1;
            // A zero byte terminates the run (XORing zero above was a no-op).
            if x == 0 {
                break;
            }
        }
    }

    if crc32(source) != le_u32(patch, body_end) {
        return Err(PatchError::SourceCrcMismatch);
    }
    if crc32(&patch[..patch.len() - 4]) != le_u32(patch, body_end + 8) {
        return Err(PatchError::PatchCrcMismatch);
    }
    if crc32(&out) != le_u32(patch, body_end + 4) {
        return Err(PatchError::OutputCrcMismatch);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The shared VLE encoder — the exact inverse of `Cursor::read_vle`, used to
    /// assemble valid test patches.
    fn encode_vle(mut n: u64, out: &mut Vec<u8>) {
        loop {
            let x = (n & 0x7f) as u8;
            n >>= 7;
            if n == 0 {
                out.push(0x80 | x);
                break;
            }
            out.push(x);
            n -= 1;
        }
    }

    #[test]
    fn vle_round_trips() {
        for n in [0u64, 1, 127, 128, 255, 256, 16_383, 16_384, 1_000_000] {
            let mut buf = Vec::new();
            encode_vle(n, &mut buf);
            let mut c = Cursor::new(&buf, 0);
            assert_eq!(c.read_vle().unwrap(), n, "VLE failed for {n}");
        }
    }

    /// Build a minimal BPS patch that emits `target` via a single TargetRead,
    /// then apply it and confirm we get `target` back.
    fn bps_target_read(source: &[u8], target: &[u8]) -> Vec<u8> {
        let mut p = Vec::new();
        p.extend_from_slice(b"BPS1");
        encode_vle(source.len() as u64, &mut p);
        encode_vle(target.len() as u64, &mut p);
        encode_vle(0, &mut p); // no metadata
        // TargetRead command (1) of the whole target.
        let data = (((target.len() - 1) as u64) << 2) | 1;
        encode_vle(data, &mut p);
        p.extend_from_slice(target);
        // Footer: source CRC, target CRC, then patch CRC over everything so far.
        p.extend_from_slice(&crc32(source).to_le_bytes());
        p.extend_from_slice(&crc32(target).to_le_bytes());
        let patch_crc = crc32(&p);
        p.extend_from_slice(&patch_crc.to_le_bytes());
        p
    }

    #[test]
    fn bps_applies_a_target_read_patch() {
        let source = b"the quick brown fox".to_vec();
        let target = b"THE LAZY DOG jumps!".to_vec();
        let patch = bps_target_read(&source, &target);
        assert_eq!(apply(PatchFormat::Bps, &source, &patch).unwrap(), target);
    }

    #[test]
    fn bps_source_read_reuses_the_base() {
        // TargetRead the first 3 bytes, then SourceRead the remaining tail
        // verbatim from the base — exercises command 0.
        let source = b"ABCDEFGHIJ".to_vec();
        let mut target = b"xyz".to_vec();
        target.extend_from_slice(&source[3..]); // "xyzDEFGHIJ"
        let mut p = Vec::new();
        p.extend_from_slice(b"BPS1");
        encode_vle(source.len() as u64, &mut p);
        encode_vle(target.len() as u64, &mut p);
        encode_vle(0, &mut p);
        // TargetRead 3 bytes "xyz"
        encode_vle(((3u64 - 1) << 2) | 1, &mut p);
        p.extend_from_slice(b"xyz");
        // SourceRead the remaining 7 bytes (command 0) — copies source[3..10].
        encode_vle(((7u64 - 1) << 2) | 0, &mut p);
        p.extend_from_slice(&crc32(&source).to_le_bytes());
        p.extend_from_slice(&crc32(&target).to_le_bytes());
        let patch_crc = crc32(&p);
        p.extend_from_slice(&patch_crc.to_le_bytes());
        assert_eq!(apply(PatchFormat::Bps, &source, &p).unwrap(), target);
    }

    #[test]
    fn bps_rejects_the_wrong_base() {
        let source = b"the quick brown fox".to_vec();
        let target = b"THE LAZY DOG jumps!".to_vec();
        let patch = bps_target_read(&source, &target);
        let wrong = b"a completely other x".to_vec(); // same length, different bytes
        assert_eq!(
            apply(PatchFormat::Bps, &wrong, &patch),
            Err(PatchError::SourceCrcMismatch)
        );
    }

    #[test]
    fn bps_rejects_a_corrupt_patch() {
        let source = b"the quick brown fox".to_vec();
        let target = b"THE LAZY DOG jumps!".to_vec();
        let mut patch = bps_target_read(&source, &target);
        // Flip a byte in the middle of the patch body — the patch CRC must catch it.
        let mid = patch.len() / 2;
        patch[mid] ^= 0xff;
        assert!(apply(PatchFormat::Bps, &source, &patch).is_err());
    }

    /// Build a UPS patch as a single XOR hunk from offset 0. `source` and
    /// `target` must be equal at `term` (the terminator position) and the run
    /// 0..term must have no zero XOR byte.
    fn ups_single_hunk(source: &[u8], target: &[u8], term: usize) -> Vec<u8> {
        let mut p = Vec::new();
        p.extend_from_slice(b"UPS1");
        encode_vle(source.len() as u64, &mut p);
        encode_vle(target.len() as u64, &mut p);
        encode_vle(0, &mut p); // skip 0
        for i in 0..term {
            let x = source[i] ^ target[i];
            assert!(x != 0, "diff byte must be non-zero before the terminator");
            p.push(x);
        }
        p.push(0); // terminator (source[term] == target[term])
        p.extend_from_slice(&crc32(source).to_le_bytes());
        p.extend_from_slice(&crc32(target).to_le_bytes());
        let patch_crc = crc32(&p);
        p.extend_from_slice(&patch_crc.to_le_bytes());
        p
    }

    #[test]
    fn ups_applies_an_xor_hunk() {
        let source = vec![1u8, 2, 3, 4, 5];
        // Differ (non-zero xor) at 0,1,2; equal at 3 (the terminator) and 4.
        let target = vec![10u8, 20, 30, 4, 5];
        let patch = ups_single_hunk(&source, &target, 3);
        assert_eq!(apply(PatchFormat::Ups, &source, &patch).unwrap(), target);
    }

    #[test]
    fn ups_rejects_the_wrong_base() {
        let source = vec![1u8, 2, 3, 4, 5];
        let target = vec![10u8, 20, 30, 4, 5];
        let patch = ups_single_hunk(&source, &target, 3);
        let wrong = vec![9u8, 9, 9, 9, 9];
        assert_eq!(
            apply(PatchFormat::Ups, &wrong, &patch),
            Err(PatchError::SourceCrcMismatch)
        );
    }

    #[test]
    fn rejects_bad_magic() {
        assert_eq!(
            apply(PatchFormat::Bps, b"x", &[0u8; 32]),
            Err(PatchError::Malformed("BPS"))
        );
    }
}
