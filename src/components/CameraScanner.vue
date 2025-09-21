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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div ref="videoBoxRef" class="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video ref="videoRef" playsinline autoplay muted class="w-full h-full object-cover"></video>
              <!-- Overlay target square (center) -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="border-4 border-white/90 rounded-lg" :style="overlayStyle"></div>
              </div>
              <!-- Live 3x3 color preview -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="grid grid-cols-3 grid-rows-3 gap-1" :style="overlayStyle">
                  <div v-for="(c, i) in previewColors" :key="'p'+i" class="rounded opacity-80 border border-white/60" :style="{ background: c }"></div>
                </div>
              </div>
              <!-- 3x3 guide -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="grid grid-cols-3 grid-rows-3 gap-1" :style="overlayStyle">
                  <div v-for="i in 9" :key="i" class="border-2 border-white/50"></div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <p-button class="w-full sm:w-auto" :label="$t('scan.capture')" icon="pi pi-camera" @click="capture" :disabled="!streamReady" />
              <p-button class="w-full sm:w-auto" :label="$t('scan.flip')" icon="pi pi-sync" @click="toggleFacingMode"/>
              <p-button v-if="torchSupported" class="w-full sm:w-auto" :label="$t('scan.torch')" :severity="torchOn ? 'warning' : 'secondary'" :icon="torchOn ? 'pi pi-bolt' : 'pi pi-bolt'" @click="toggleTorch"/>
            </div>
            <p class="text-sm text-slate-500 mt-2">{{ $t('scan.help') }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ $t('scan.live') }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-lg">{{ $t('scan.currentFace') }} <span :style="{color: faceHex(currentFace)}">{{ currentFace }}</span></h3>
              <div class="text-sm text-slate-500">{{ progressText }}</div>
            </div>
            <div class="grid grid-cols-3 grid-rows-3 gap-2">
              <button
                v-for="(cell, idx) in currentGrid"
                :key="idx"
                @click="onCellClick(idx)"
                class="relative rounded-lg aspect-square border-2 shadow focus:outline-none"
                :class="{ 'ring-4 ring-brand-blue': selectedIndex === idx, 'opacity-70': idx === 4 }"
                :disabled="idx === 4"
                :style="{ background: faceHex(cell), borderColor: '#111' }"
              >
                <i v-if="idx === 4" class="pi pi-lock text-slate-800 absolute right-1 top-1 text-xs"></i>
              </button>
            </div>

            <!-- Color palette for selected cell -->
            <div class="mt-3">
              <div class="text-sm font-semibold mb-1">{{ $t('scan.edit') }}</div>
              <div class="grid grid-cols-6 gap-2">
                <button v-for="f in paletteFaces" :key="f" class="rounded-lg aspect-square border-2 font-bold text-xs" :style="{ background: faceHex(f), borderColor: '#111', color: f==='D' ? '#111' : '#111' }" @click="applyPalette(f)">{{ f }}</button>
              </div>
              <div v-if="selectedIndex === 4" class="text-xs text-slate-500 mt-1">{{ $t('scan.centerLocked') }}</div>
            </div>

            <div class="flex flex-wrap gap-2 mt-3">
              <p-button class="w-full sm:w-auto" :label="$t('scan.retry')" icon="pi pi-refresh" severity="secondary" @click="redo" />
              <p-button class="w-full sm:w-auto" :label="$t('scan.confirm')" icon="pi pi-check" severity="success" @click="confirmFace" :disabled="!canConfirm" />
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
import { useUserMedia, useResizeObserver } from '@vueuse/core';
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
const videoBoxRef = ref<HTMLDivElement | null>(null);
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
const selectedIndex = ref<number>(0);
const paletteFaces: FaceLabel[] = ['U','R','F','D','L','B'];

// live preview colors as CSS strings
const previewColors = ref<string[]>(Array(9).fill('transparent'));
let previewTimer: number | null = null;

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

// Size overlay according to visible video box
useResizeObserver(videoBoxRef, (entries) => {
  const rect = entries[0].contentRect;
  const s = Math.floor(Math.min(rect.width, rect.height) * 0.75);
  overlaySize.value = Math.max(160, Math.min(420, s));
});

// Use vueuse to manage media stream
const constraints = computed<MediaStreamConstraints>(() => ({
  video: {
    facingMode: facingMode.value,
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
}));
const { stream, start, stop } = useUserMedia({ constraints });

// Torch support
const torchSupported = ref(false);
const torchOn = ref(false);

async function updateTorchSupport() {
  try {
    const s = stream.value as MediaStream | null;
    const track = s?.getVideoTracks?.()[0];
    const caps = (track && (track.getCapabilities?.() as any)) || {};
    torchSupported.value = !!caps.torch;
  } catch { torchSupported.value = false; }
}

async function toggleTorch() {
  try {
    const s = stream.value as MediaStream | null;
    const track = s?.getVideoTracks?.()[0];
    if (!track) return;
    torchOn.value = !torchOn.value;
    await (track as any).applyConstraints?.({ advanced: [{ torch: torchOn.value }] });
  } catch {
    // ignore
  }
}

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
      updateTorchSupport();
      startPreview();
    };
  } else {
    streamReady.value = false;
    (video as any).srcObject = null;
    stopPreview();
  }
});

function toggleFacingMode() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  // vueuse will re-create stream when constraints change
}

function startPreview() {
  stopPreview();
  previewTimer = window.setInterval(() => {
    if (!videoRef.value || !canvasRef.value) return;
    const video = videoRef.value as HTMLVideoElement;
    if (!video.videoWidth || !video.videoHeight) return;
    const { size, margin, cell } = getSampleGeometry(video);
    const canvas = canvasRef.value as HTMLCanvasElement;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const cols: string[] = [];
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        const x = margin + gx * cell + Math.floor(cell * 0.25);
        const y = margin + gy * cell + Math.floor(cell * 0.25);
        const w = Math.floor(cell * 0.5);
        const h = Math.floor(cell * 0.5);
        const avg = averageRegionRGBA(imageData as any, x, y, w, h) as any;
        cols.push(`rgb(${avg.r}, ${avg.g}, ${avg.b})`);
      }
    }
    previewColors.value = cols;
  }, 200) as unknown as number;
}
function stopPreview() {
  if (previewTimer) { clearInterval(previewTimer); previewTimer = null; }
}

function getSampleGeometry(video: HTMLVideoElement) {
  const size = Math.min(video.videoWidth, video.videoHeight);
  const margin = Math.round(size * 0.15);
  const sampleSize = size - margin * 2;
  const cell = Math.floor(sampleSize / 3);
  return { size, margin, cell };
}

async function capture() {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value as HTMLVideoElement;
  const canvas = canvasRef.value as HTMLCanvasElement;
  if (!video.videoWidth || !video.videoHeight) return;

  // multi-frame sampling for noise reduction
  const frames = 3;
  const acc = Array.from({ length: 9 }, () => ({ r: 0, g: 0, b: 0 }));

  for (let f = 0; f < frames; f++) {
    const { size, margin, cell } = getSampleGeometry(video);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    let k = 0;
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        const x = margin + gx * cell + Math.floor(cell * 0.25);
        const y = margin + gy * cell + Math.floor(cell * 0.25);
        const w = Math.floor(cell * 0.5);
        const h = Math.floor(cell * 0.5);
        const avg = averageRegionRGBA(imageData as any, x, y, w, h) as any;
        acc[k].r += avg.r; acc[k].g += avg.g; acc[k].b += avg.b; k++;
      }
    }
    if (f < frames - 1) await new Promise(r => setTimeout(r, 60));
  }

  const found: Array<{ r: number; g: number; b: number }> = acc.map(v => ({ r: Math.round(v.r/frames), g: Math.round(v.g/frames), b: Math.round(v.b/frames) }));

  // Determine labels using center samples + defaults
  const centerRGB = found[4];
  const centerHSV = rgbToHsv(centerRGB.r, centerRGB.g, centerRGB.b);
  (centerSamples.value as any)[currentFace.value] = centerHSV;

  const samples = { ...(defaultHsv.value as any), ...(centerSamples.value as any) };
  const labels = found.map(rgb => nearestLabelFromCenters(rgb as any, samples as any)) as FaceLabel[];
  labels[4] = currentFace.value; // lock center
  currentGrid.value = labels;
}

function onCellClick(idx: number) {
  if (idx === 4) { selectedIndex.value = 4; return; }
  // select first; if same index clicked again, cycle color for quick fix
  if (selectedIndex.value === idx) {
    cycleCell(idx);
  } else {
    selectedIndex.value = idx;
  }
}

function cycleCell(idx: number) {
  const order: FaceLabel[] = ['U','R','F','D','L','B'];
  const cur = currentGrid.value[idx];
  const i = Math.max(0, order.indexOf(cur));
  currentGrid.value[idx] = order[(i + 1) % order.length];
}

function applyPalette(f: FaceLabel) {
  const idx = selectedIndex.value;
  if (idx === 4) return; // locked
  currentGrid.value[idx] = f;
}

function redo() {
  currentGrid.value = Array(9).fill(currentFace.value) as FaceLabel[];
  selectedIndex.value = 0;
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
    selectedIndex.value = 0;
  }
}

function isFaceGridValid(grid: FaceLabel[], faceLetter: FaceLabel) {
  if (grid[4] !== faceLetter) return false;
  return true;
}

onMounted(() => {
  start();
});

onBeforeUnmount(() => {
  stopPreview();
  stop();
});
</script>
