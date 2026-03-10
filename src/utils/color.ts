function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function blendHexColors(colorA: string, colorB: string, ratio = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
}

export function averageHexColors(colors: string[]) {
  const rgb = colors.map(hexToRgb);
  const total = rgb.reduce(
    (acc, value) => ({ r: acc.r + value.r, g: acc.g + value.g, b: acc.b + value.b }),
    { r: 0, g: 0, b: 0 },
  );
  return rgbToHex({
    r: total.r / colors.length,
    g: total.g / colors.length,
    b: total.b / colors.length,
  });
}
