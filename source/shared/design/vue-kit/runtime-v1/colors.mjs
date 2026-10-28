import { TinyColor, readability } from '@ctrl/tinycolor';

// Custom brand colors remain unchanged; only foregrounds adapt for readable text.
export function readableInk(color, background, dark) {
  const base = new TinyColor(color);
  for (let amount = 0; amount <= 100; amount += 2) {
    const candidate = base.mix(dark ? '#ffffff' : '#000000', amount).toHexString();
    if (readability(candidate, background) >= 4.5) return candidate;
  }
  return dark ? '#ffffff' : '#000000';
}
export function solidForeground(color) {
  // Pure black/white guarantee 4.5:1 on any opaque sRGB background; near-black
  // can leave a narrow middle-luminance gap where neither choice reaches 4.5.
  return readability('#ffffff', color) >= readability('#000000', color) ? '#ffffff' : '#000000';
}
