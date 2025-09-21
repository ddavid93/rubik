// Basic validation for scanned cube faces
// faces: { U:[9], R:[9], F:[9], D:[9], L:[9], B:[9] } where entries are labels among U R F D L B

export function validateFaces(faces) {
  // Ensure all faces exist
  const keys = ['U','R','F','D','L','B'];
  for (const k of keys) {
    if (!faces[k] || faces[k].length !== 9) return { valid: false, code: 'missingFace', args: { k } };
  }

  // Check center stickers define face color
  for (const k of keys) {
    const center = faces[k][4];
    if (center !== k) {
      return { valid: false, code: 'centerMismatch', args: { k } };
    }
  }

  // Count colors
  const counts = { U:0,R:0,F:0,D:0,L:0,B:0 };
  for (const k of keys) {
    for (const c of faces[k]) {
      if (!(c in counts)) return { valid: false, code: 'unknownColor', args: { c } };
      counts[c]++;
    }
  }
  for (const [k, v] of Object.entries(counts)) {
    if (v !== 9) return { valid: false, code: 'colorCount', args: { k, v } };
  }

  // Optional: adjacency and parity checks could be added here.
  return { valid: true };
}
