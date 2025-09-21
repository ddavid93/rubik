// Color utilities for sampling and matching

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function hsvDistance(a, b) {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180; // wrap hue
  const ds = Math.abs(a.s - b.s) / 100;
  const dv = Math.abs(a.v - b.v) / 100;
  // Weighted distance: prioritize hue, then saturation, then value
  return Math.sqrt(3 * dh * dh + 2 * ds * ds + 1 * dv * dv);
}

export function hexToRgb(hex) {
  const v = hex.replace('#','');
  const bigint = parseInt(v.length === 3 ? v.split('').map(c=>c+c).join('') : v, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function averageRegionRGBA(imageData, x, y, w, h) {
  // imageData: CanvasRenderingContext2D.getImageData(...)
  const { data, width } = imageData;
  let r=0, g=0, b=0, count=0;
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const idx = (j * width + i) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return { r: 0, g: 0, b: 0 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

export function nearestLabelFromCenters(rgb, centerSamples) {
  // centerSamples: { U:{hsv}, R:{hsv}, ... }
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  let best = 'U';
  let bestD = Infinity;
  for (const [label, sample] of Object.entries(centerSamples)) {
    const d = hsvDistance(hsv, sample);
    if (d < bestD) { bestD = d; best = label; }
  }
  return best;
}
