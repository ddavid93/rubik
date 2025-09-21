import { ref, type Ref } from 'vue';

export type FaceLabel = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type Faces = Record<FaceLabel, FaceLabel[]>;

export function useCubeScan(order: FaceLabel[] = ['U','R','F','D','L','B']) {
  const faces: Ref<Faces> = ref({
    U: Array(9).fill('U'),
    R: Array(9).fill('R'),
    F: Array(9).fill('F'),
    D: Array(9).fill('D'),
    L: Array(9).fill('L'),
    B: Array(9).fill('B')
  } as Faces);

  const scannedOrder = ref<FaceLabel[]>([]);

  function setFace(faceKey: FaceLabel, colors: FaceLabel[]) {
    faces.value[faceKey] = colors.slice(0, 9) as FaceLabel[];
    if (!scannedOrder.value.includes(faceKey)) scannedOrder.value.push(faceKey);
  }

  function reset() {
    faces.value = {
      U: Array(9).fill('U'),
      R: Array(9).fill('R'),
      F: Array(9).fill('F'),
      D: Array(9).fill('D'),
      L: Array(9).fill('L'),
      B: Array(9).fill('B')
    } as Faces;
    scannedOrder.value = [] as FaceLabel[];
  }

  return { faces, setFace, scannedOrder, reset, order } as const;
}
