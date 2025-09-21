<template>
  <div class="w-full">
    <p-card>
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-camera text-brand-blue"></i>
          <span>{{ $t('scan.orderLabel') }}</span>
          <div class="flex gap-2">
            <span v-for="(f,i) in requiredOrder" :key="i" class="px-2 py-1 rounded-md text-sm" :style="{background: faceHex(f), color: f==='D'? '#111':'#111'}">{{ f }}</span>
          </div>
        </div>
      </template>
      <template #content>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <div class="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video ref="videoRef" playsinline autoplay muted class="w-full h-full object-cover"></video>
              <!-- Overlay target square (center) -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="border-4 border-white/90 rounded-lg" :style="overlayStyle"></div>
              </div>
              <!-- 3x3 guide -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="grid grid-cols-3 grid-rows-3 gap-1" :style="overlayStyle">
                  <div v-for="i in 9" :key="i" class="border-2 border-white/50"></div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <p-button :label="$t('scan.capture')" icon="pi pi-camera" @click="capture" :disabled="!streamReady" />
              <p-button :label="$t('scan.flip')" icon="pi pi-sync" @click="toggleFacingMode"/>
            </div>
            <p class="text-sm text-slate-500 mt-2">{{ $t('scan.help') }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-lg">{{ $t('scan.currentFace') }} <span :style="{color: faceHex(currentFace)}">{{ currentFace }}</span></h3>
              <div class="text-sm text-slate-500">{{ progressText }}</div>
            </div>
            <div class="grid grid-cols-3 grid-rows-3 gap-2">
              <button v-for="(cell, idx) in currentGrid" :key="idx" @click="cycleCell(idx)" class="rounded-lg aspect-square border-2 shadow" :style="{ background: faceHex(cell), borderColor: '#111' }"></button>
            </div>
            <div class="flex gap-2 mt-3">
              <p-button :label="$t('scan.retry')" icon="pi pi-refresh" severity="secondary" @click="redo" />
              <p-button :label="$t('scan.confirm')" icon="pi pi-check" severity="success" @click="confirmFace" :disabled="!canConfirm" />
            </div>

            <div class="mt-4">
              <h4 class="font-semibold mb-2">{{ $t('scan.scannedFaces') }}</h4>
              <div class="grid grid-cols-3 gap-3">
                <div v-for="f in requiredOrder" :key="f" class="border rounded-lg p-2" :class="{'opacity-40': !faces[f] || !isFaceFilled(f)}">
                  <div class="text-sm mb-2">{{ f }}</div>
                  <div class="grid grid-cols-3 gap-1">
                    <div v-for="(c,i) in (faces[f] || empty)" :key="i" class="aspect-square rounded" :style="{background: faceHex(c||'U'), border:'1px solid #111'}"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <canvas ref="canvasRef" class="hidden"></canvas>
      </template>
    </p-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, watchEffect } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { useUserMedia } from '@vueuse/core';
import { FACE_COLORS } from '../utils/constants';
import { averageRegionRGBA, rgbToHsv, nearestLabelFromCenters, hexToRgb } from '../utils/color';
import { useI18n } from 'vue-i18n';

 type FaceLabel = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

 type Faces = Record<FaceLabel, FaceLabel[]>;

 type Props = {
  requiredOrder: FaceLabel[];
  faces: Partial<Faces>;
  completed: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits(['update:faces', 'update:completed']);

const { t } = useI18n();

const empty = Array(9).fill(null) as (FaceLabel | null)[];
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const streamReady = ref(false);
const facingMode = ref<'environment' | 'user'>('environment');
const overlaySize = ref(240);

const faces = ref<Record<string, FaceLabel[]>>({ ...(props.faces as any) });
watch(() => props.faces, (v) => { faces.value = { ...(v as any) }; }, { deep: true });
watch(faces, (v) => emit('update:faces', v), { deep: true });

const scanned = ref<FaceLabel[]>([]);
const currentFaceIndex = ref(0);
const currentFace = computed<FaceLabel>(() => props.requiredOrder[currentFaceIndex.value] || 'U');
const currentGrid = ref<FaceLabel[]>(Array(9).fill(currentFace.value) as FaceLabel[]);

// Center color samples in HSV for each face label, filled as we scan
const centerSamples = ref<Record<FaceLabel, { h: number; s: number; v: number }>>({} as any);
// Canonical HSV seeds from brand colors to improve first capture before sampling all centers
const defaultHsv = computed<Record<FaceLabel, { h: number; s: number; v: number }>>(() => {
  const out: Record<FaceLabel, { h: number; s: number; v: number }> = {} as any;
  const order: FaceLabel[] = ['U','R','F','D','L','B'];
  for (const k of order) {
    const rgb = hexToRgb((FACE_COLORS as any)[k]);
    out[k] = rgbToHsv(rgb.r, rgb.g, rgb.b);
  }
  return out;
});

const overlayStyle = computed(() => ({ width: overlaySize.value + 'px', height: overlaySize.value + 'px' }));

const progressText = computed(() => t('scan.progress', { count: scanned.value.length, total: props.requiredOrder.length }));
const canConfirm = computed(() => isFaceGridValid(currentGrid.value, currentFace.value));

function isFaceFilled(f: FaceLabel) {
  const face = (faces.value as any)[f];
  return Array.isArray(face) && face.length === 9 && face.every(Boolean);
}

function faceHex(label: FaceLabel) { return (FACE_COLORS as any)[label] || '#ccc'; }

// Use vueuse to manage media stream
const constraints = computed<MediaStreamConstraints>(() => ({ video: { facingMode: facingMode.value } }));
const { stream, start, stop } = useUserMedia({ constraints });

watchEffect(() => {
  const s = stream.value as MediaStream | null;
  const video = videoRef.value;
  if (!video) return;
  if (s) {
    streamReady.value = false;
    (video as any).srcObject = s;
    // Wait for metadata to ensure dimensions are available
    (video as any).onloadedmetadata = () => {
      const p = (video as any).play?.();
      if (p && typeof p.then === 'function') p.catch(() => {});
      streamReady.value = (video.videoWidth > 0 && video.videoHeight > 0);
    };
  } else {
    streamReady.value = false;
    (video as any).srcObject = null;
  }
});

function toggleFacingMode() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  // vueuse will re-create stream when constraints change
}

function capture() {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value as HTMLVideoElement;
  const canvas = canvasRef.value as HTMLCanvasElement;
  if (!video.videoWidth || !video.videoHeight) return;
  const size = Math.min(video.videoWidth, video.videoHeight);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Draw centered square from video to canvas
  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

  // Sample a central square proportionally to overlaySize
  const margin = Math.round(size * 0.15); // ignore borders
  const sampleSize = size - margin * 2;
  const gridN = 3;
  const cell = Math.floor(sampleSize / gridN);
  const imageData = ctx.getImageData(0, 0, size, size);

  const found: Array<{ r: number; g: number; b: number }> = [];
  for (let gy = 0; gy < gridN; gy++) {
    for (let gx = 0; gx < gridN; gx++) {
      const x = margin + gx * cell + Math.floor(cell * 0.25);
      const y = margin + gy * cell + Math.floor(cell * 0.25);
      const w = Math.floor(cell * 0.5);
      const h = Math.floor(cell * 0.5);
      const avg = averageRegionRGBA(imageData as any, x, y, w, h);
      found.push(avg);
    }
  }

  // Determine labels using center samples when available; otherwise, guess using default mapping to closest canonical HSV
  // If centerSamples missing, bootstrap center as the middle sticker
  const centerRGB = found[4];
  const centerHSV = rgbToHsv(centerRGB.r, centerRGB.g, centerRGB.b);
  // Set current face center sample
  (centerSamples.value as any)[currentFace.value] = centerHSV;

  const samples = { ...(defaultHsv.value as any), ...(centerSamples.value as any) };
  const labels = found.map(rgb => nearestLabelFromCenters(rgb as any, samples as any)) as FaceLabel[];
  // Ensure center is labeled as current face
  labels[4] = currentFace.value;
  currentGrid.value = labels;
}

function cycleCell(idx: number) {
  // Allow manual correction: cycle through URFDLB
  const order: FaceLabel[] = ['U','R','F','D','L','B'];
  const cur = currentGrid.value[idx];
  const i = Math.max(0, order.indexOf(cur));
  currentGrid.value[idx] = order[(i + 1) % order.length];
}

function redo() {
  currentGrid.value = Array(9).fill(currentFace.value) as FaceLabel[];
}

function confirmFace() {
  if (!canConfirm.value) return;
  (faces.value as any)[currentFace.value] = currentGrid.value.slice();
  if (!scanned.value.includes(currentFace.value)) scanned.value.push(currentFace.value);
  if (scanned.value.length === props.requiredOrder.length) {
    emit('update:completed', true);
  } else {
    emit('update:completed', false);
    // move to next face
    currentFaceIndex.value++;
    currentGrid.value = Array(9).fill(props.requiredOrder[currentFaceIndex.value] || 'U') as FaceLabel[];
  }
}

function isFaceGridValid(grid: FaceLabel[], faceLetter: FaceLabel) {
  // center must match face
  if (grid[4] !== faceLetter) return false;
  return true;
}

onMounted(() => {
  start();
});

onBeforeUnmount(() => {
  stop();
});
</script>
