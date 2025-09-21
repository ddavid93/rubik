import { ref } from 'vue';

// Faces are labeled using standard scheme: U (blanco), R (rojo), F (verde), D (amarillo), L (naranja), B (azul)
export function useCubeScan(order = ['U','R','F','D','L','B']) {
  const faces = ref({ U: Array(9).fill('U'), R: Array(9).fill('R'), F: Array(9).fill('F'), D: Array(9).fill('D'), L: Array(9).fill('L'), B: Array(9).fill('B') });
  const scannedOrder = ref([]);

  function setFace(faceKey, colors) {
    faces.value[faceKey] = colors.slice(0, 9);
    if (!scannedOrder.value.includes(faceKey)) scannedOrder.value.push(faceKey);
  }

  function reset() {
    faces.value = { U: Array(9).fill('U'), R: Array(9).fill('R'), F: Array(9).fill('F'), D: Array(9).fill('D'), L: Array(9).fill('L'), B: Array(9).fill('B') };
    scannedOrder.value = [];
  }

  return { faces, setFace, scannedOrder, reset, order };
}
