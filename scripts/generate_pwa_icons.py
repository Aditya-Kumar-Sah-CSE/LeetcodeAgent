"""
Generate high-resolution PWA icons for LeetCode AI Agent.
Generates pure PNG and SVG assets without external dependencies.
"""

import math
import struct
import zlib
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT_DIR / "frontend" / "public" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1f2e" />
      <stop offset="100%" stop-color="#0f1117" />
    </linearGradient>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#6c63ff" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#6c63ff" stroke-width="4" stroke-opacity="0.3" />
  <!-- Central Lightning Bolt & Code Glyph -->
  <g filter="url(#glow)">
    <path d="M280 64 L160 268 L248 268 L216 448 L360 224 L272 224 Z" fill="url(#bolt)" stroke="#fff" stroke-width="6" stroke-linejoin="round" />
  </g>
  <!-- Subtle Coding Brackets -->
  <path d="M130 190 L90 256 L130 322" fill="none" stroke="#9aa0b8" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
  <path d="M382 190 L422 256 L382 322" fill="none" stroke="#9aa0b8" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
</svg>"""


def point_in_polygon(x: float, y: float, poly: list) -> bool:
    """Ray-casting algorithm for point in polygon."""
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def create_pwa_png(size: int, is_maskable: bool = False) -> bytes:
    """Create a stylized PNG icon for PWA."""
    # Scale bolt polygon to size
    scale = size / 512.0
    scale_factor = 0.82 if is_maskable else 1.0
    center = size / 2.0

    raw_poly = [
        (280, 64),
        (160, 268),
        (248, 268),
        (216, 448),
        (360, 224),
        (272, 224),
    ]

    bolt_poly = []
    for px, py in raw_poly:
        nx = center + (px - 256) * scale * scale_factor
        ny = center + (py - 256) * scale * scale_factor
        bolt_poly.append((nx, ny))

    corner_radius = size * (0.0 if is_maskable else 0.22)
    rows = []

    for y in range(size):
        row = bytearray(b"\x00")  # filter byte
        for x in range(size):
            # Check rounded corner
            dx = max(0, max(corner_radius - x, x - (size - corner_radius)))
            dy = max(0, max(corner_radius - y, y - (size - corner_radius)))
            dist_sq = dx * dx + dy * dy

            if not is_maskable and dist_sq > corner_radius * corner_radius:
                # Transparent outside rounded corner
                row.extend((0, 0, 0, 0))
                continue

            # Check if in bolt polygon
            if point_in_polygon(x, y, bolt_poly):
                # Gradient violet to cyan bolt
                factor = y / float(size)
                r = int(140 * (1 - factor) + 56 * factor)
                g = int(99 * (1 - factor) + 189 * factor)
                b = int(255 * (1 - factor) + 248 * factor)
                row.extend((r, g, b, 255))
            else:
                # Dark navy gradient background
                bg_factor = (x + y) / float(2 * size)
                r = int(28 * (1 - bg_factor) + 15 * bg_factor)
                g = int(31 * (1 - bg_factor) + 17 * bg_factor)
                b = int(46 * (1 - bg_factor) + 23 * bg_factor)
                row.extend((r, g, b, 255))

        rows.append(bytes(row))

    raw_data = b"".join(rows)
    idat = zlib.compress(raw_data, 9)

    # Construct PNG chunks
    png = b"\x89PNG\r\n\x1a\n"
    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png += struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data
    png += struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data))
    # IDAT
    png += struct.pack(">I", len(idat)) + b"IDAT" + idat
    png += struct.pack(">I", zlib.crc32(b"IDAT" + idat))
    # IEND
    png += struct.pack(">I", 0) + b"IEND"
    png += struct.pack(">I", zlib.crc32(b"IEND"))

    return png


def main():
    print("[*] Generating PWA Icons...")
    # 1. SVG
    (ICONS_DIR / "icon.svg").write_text(SVG_CONTENT, encoding="utf-8")
    print("[+] Created icons/icon.svg")

    # 2. 192x192
    png_192 = create_pwa_png(192)
    (ICONS_DIR / "icon-192.png").write_bytes(png_192)
    print("[+] Created icons/icon-192.png")

    # 3. 512x512
    png_512 = create_pwa_png(512)
    (ICONS_DIR / "icon-512.png").write_bytes(png_512)
    print("[+] Created icons/icon-512.png")

    # 4. 512x512 Maskable
    png_maskable = create_pwa_png(512, is_maskable=True)
    (ICONS_DIR / "icon-512-maskable.png").write_bytes(png_maskable)
    print("[+] Created icons/icon-512-maskable.png")

    # 5. Apple Touch Icon (180x180)
    png_apple = create_pwa_png(180)
    (ICONS_DIR / "apple-touch-icon.png").write_bytes(png_apple)
    print("[+] Created icons/apple-touch-icon.png")

    print("[OK] All PWA icons generated successfully!")


if __name__ == "__main__":
    main()
