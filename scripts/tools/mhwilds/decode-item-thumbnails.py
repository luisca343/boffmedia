#!/usr/bin/env python3
"""Decode Wilds item-thumbnail TEX files that use DirectStorage GDeflate.

REToolCustom can convert the game's monster report textures, but its TEX path
does not understand the GDeflate-wrapped UI thumbnails. This helper uses the
libGDeflate DLL shipped beside REToolCustom, removes the row padding from the
first BC7 mip, and writes a one-mip DX10 DDS for texconv.
"""

from __future__ import annotations

import argparse
import ctypes
import struct
from pathlib import Path


class GDeflatePage(ctypes.Structure):
    _fields_ = [
        ("data", ctypes.c_void_p),
        ("nbytes", ctypes.c_uint32),
    ]


def decode_page(
    decompressor: int,
    library: ctypes.WinDLL,
    compressed: bytes,
    output_size: int,
) -> bytes:
    source = ctypes.create_string_buffer(compressed)
    page = GDeflatePage(ctypes.cast(source, ctypes.c_void_p), len(compressed))
    output = ctypes.create_string_buffer(output_size)
    actual = ctypes.c_uint32()
    result = library.libdeflate_gdeflate_decompress(
        decompressor,
        ctypes.byref(page),
        1,
        output,
        output_size,
        ctypes.byref(actual),
    )
    if result != 0 or actual.value != output_size:
        raise RuntimeError(
            f"GDeflate failed with result {result}; "
            f"expected {output_size} bytes, got {actual.value}"
        )
    return output.raw


def tight_bc7_rows(data: bytes, width: int, height: int, pitch: int) -> bytes:
    blocks_per_row = (width + 3) // 4
    row_size = blocks_per_row * 16
    rows = (height + 3) // 4
    if pitch < row_size or len(data) < pitch * rows:
        raise RuntimeError(
            f"Invalid BC7 row layout: pitch={pitch}, row={row_size}, "
            f"data={len(data)}, rows={rows}"
        )
    return b"".join(
        data[row * pitch : row * pitch + row_size] for row in range(rows)
    )


def dds_header(width: int, height: int, payload_size: int) -> bytes:
    # DDS_HEADER followed by a DX10 extended header for DXGI_FORMAT_BC7_UNORM.
    dds_flags = 0x00081007  # CAPS | HEIGHT | WIDTH | PIXELFORMAT | LINEARSIZE
    pixel_format = struct.pack(
        "<IIIIIIII",
        32,
        0x4,  # DDPF_FOURCC
        struct.unpack("<I", b"DX10")[0],
        0,
        0,
        0,
        0,
        0,
    )
    header = struct.pack(
        "<IIIIIII",
        124,
        dds_flags,
        height,
        width,
        payload_size,
        0,
        1,
    )
    header += b"\0" * (11 * 4)
    header += pixel_format
    header += struct.pack("<IIIII", 0x1000, 0, 0, 0, 0)
    dx10 = struct.pack(
        "<IIIII",
        98,  # DXGI_FORMAT_BC7_UNORM
        3,  # D3D10_RESOURCE_DIMENSION_TEXTURE2D
        0,
        1,
        0,
    )
    return b"DDS " + header + dx10


def decode_texture(path: Path, dll: ctypes.WinDLL) -> None:
    data = path.read_bytes()
    if data[:4] != b"TEX\0" or len(data) < 56:
        raise RuntimeError(f"Not a supported TEX file: {path}")

    width = data[8] | (data[9] << 8)
    height = data[10] | (data[11] << 8)
    data_offset = struct.unpack_from("<I", data, 40)[0]
    pitch = struct.unpack_from("<I", data, 48)[0]
    image_size = struct.unpack_from("<I", data, 52)[0]
    if data_offset + 12 > len(data):
        raise RuntimeError(f"TEX image data is truncated: {path}")

    # Wilds stores an 8-byte mip record before the DirectStorage stream.
    stream = data_offset + 8
    stream_id, stream_magic, tile_count = struct.unpack_from("<BBH", data, stream)
    if stream_id != 4 or stream_magic != 0xFB or tile_count != 1:
        raise RuntimeError(
            f"Unsupported item GDeflate stream in {path}: "
            f"id={stream_id}, magic={stream_magic:#x}, tiles={tile_count}"
        )
    stream_header_size = 8 + 4 * tile_count
    compressed_size = struct.unpack_from("<I", data, stream + 8)[0]
    compressed_start = stream + stream_header_size
    compressed_end = compressed_start + compressed_size
    if compressed_end > len(data):
        raise RuntimeError(f"GDeflate payload is truncated: {path}")

    decompressor = dll.libdeflate_alloc_gdeflate_decompressor()
    if not decompressor:
        raise RuntimeError("Could not allocate the GDeflate decompressor")
    try:
        decoded = decode_page(
            decompressor,
            dll,
            data[compressed_start:compressed_end],
            image_size,
        )
    finally:
        dll.libdeflate_free_gdeflate_decompressor(decompressor)

    payload = tight_bc7_rows(decoded, width, height, pitch)
    output = path.with_suffix("").with_suffix(".dds")
    output.write_bytes(dds_header(width, height, len(payload)) + payload)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--dll", type=Path, required=True)
    args = parser.parse_args()

    dll = ctypes.WinDLL(str(args.dll))
    dll.libdeflate_alloc_gdeflate_decompressor.restype = ctypes.c_void_p
    dll.libdeflate_gdeflate_decompress.argtypes = [
        ctypes.c_void_p,
        ctypes.POINTER(GDeflatePage),
        ctypes.c_uint32,
        ctypes.c_void_p,
        ctypes.c_uint32,
        ctypes.POINTER(ctypes.c_uint32),
    ]
    dll.libdeflate_gdeflate_decompress.restype = ctypes.c_int
    dll.libdeflate_free_gdeflate_decompressor.argtypes = [ctypes.c_void_p]

    files = sorted(
        args.root.glob(
            "natives/stm/gui/ui_texture/tex080000/tex_thumbnail/item/it??/"
            "tex_it????_????_imlm4.tex.*"
        )
    )
    for path in files:
        decode_texture(path, dll)
    print(f"[mhwilds-item-thumbnails] decoded={len(files)}")


if __name__ == "__main__":
    main()
