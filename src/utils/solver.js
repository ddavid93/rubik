// Wrapper around the min2phase solver
// Input: faces {U,R,F,D,L,B} arrays of 9 labels each (U,R,F,D,L,B)
// Output: array of moves, e.g., ['R', "U'", 'F2', ...]

function facesToFacelets(faces) {
  // URFDLB order
  return (
    faces.U.join('') +
    faces.R.join('') +
    faces.F.join('') +
    faces.D.join('') +
    faces.L.join('') +
    faces.B.join('')
  );
}

export async function solveFromFaces(faces) {
  const facelets = facesToFacelets(faces);
  // Lazy-load solver
  let mod;
  try {
    mod = await import('min2phase');
  } catch (e) {
    throw new Error('El solucionador no está disponible. Asegúrate de instalar las dependencias (min2phase).');
  }

  // Try common APIs
  let solutionString;
  if (typeof mod.solution === 'function') {
    solutionString = mod.solution(facelets);
  } else if (typeof mod.solve === 'function') {
    solutionString = mod.solve(facelets);
  } else if (typeof mod.default === 'function') {
    solutionString = mod.default(facelets);
  } else {
    // Some builds expose a class
    const Solver = mod.Min2Phase || mod.Solver || null;
    if (Solver) {
      const s = new Solver();
      solutionString = s.solve(facelets);
    }
  }

  if (typeof solutionString !== 'string') {
    throw new Error('No se pudo obtener una solución: formato desconocido del módulo de solver.');
  }

  // The solution may contain moves and possibly timing info like "(21f)"; clean it
  const cleaned = solutionString
    .replace(/\(.*?\)/g, '')
    .trim();
  if (!cleaned) return [];

  const moves = cleaned
    .split(/\s+/)
    .filter(Boolean);
  return moves;
}
