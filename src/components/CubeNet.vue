<template>
  <div class="flex justify-center">
    <!-- Simple 2D net:       -->
    <!--       U              -->
    <!--     L F R B          -->
    <!--       D              -->
    <div class="grid grid-cols-12 gap-1">
      <div class="col-span-12 flex justify-center mb-1">
        <div class="p-1 border rounded-lg">
          <div class="text-center text-xs mb-1">U</div>
          <div class="grid grid-cols-3 gap-1">
            <div v-for="(c,i) in (faces.U || Array(9).fill('U'))" :key="'U'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
          </div>
        </div>
      </div>
      <div class="col-span-12 grid grid-cols-12 gap-1 mb-1">
        <div class="col-span-3 flex justify-center">
          <div class="p-1 border rounded-lg">
            <div class="text-center text-xs mb-1">L</div>
            <div class="grid grid-cols-3 gap-1">
              <div v-for="(c,i) in (faces.L || Array(9).fill('U'))" :key="'L'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
            </div>
          </div>
        </div>
        <div class="col-span-3 flex justify-center">
          <div class="p-1 border rounded-lg">
            <div class="text-center text-xs mb-1">F</div>
            <div class="grid grid-cols-3 gap-1">
              <div v-for="(c,i) in (faces.F || Array(9).fill('U'))" :key="'F'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
            </div>
          </div>
        </div>
        <div class="col-span-3 flex justify-center">
          <div class="p-1 border rounded-lg">
            <div class="text-center text-xs mb-1">R</div>
            <div class="grid grid-cols-3 gap-1">
              <div v-for="(c,i) in (faces.R || Array(9).fill('U'))" :key="'R'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
            </div>
          </div>
        </div>
        <div class="col-span-3 flex justify-center">
          <div class="p-1 border rounded-lg">
            <div class="text-center text-xs mb-1">B</div>
            <div class="grid grid-cols-3 gap-1">
              <div v-for="(c,i) in (faces.B || Array(9).fill('U'))" :key="'B'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-span-12 flex justify-center">
        <div class="p-1 border rounded-lg">
          <div class="text-center text-xs mb-1">D</div>
          <div class="grid grid-cols-3 gap-1">
            <div v-for="(c,i) in (faces.D || Array(9).fill('U'))" :key="'D'+i" class="w-6 h-6 md:w-8 md:h-8 rounded" :style="{ background: faceHex(c), border: '1px solid #111' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FACE_COLORS } from '../utils/constants';

type FaceLabel = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

type Faces = Partial<Record<FaceLabel, FaceLabel[]>>;

const props = defineProps<{ faces: Faces }>();
function faceHex(label: FaceLabel) { return (FACE_COLORS as any)[label] || '#ccc'; }
</script>
