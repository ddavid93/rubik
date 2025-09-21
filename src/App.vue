<template>
  <div class="min-h-screen flex flex-col">
    <header class="p-4 md:p-6 bg-gradient-to-r from-brand-blue to-brand-green text-white shadow">
      <div class="container mx-auto flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <img src="/favicon.svg" alt="Rubik" class="w-10 h-10" />
          <h1 class="kid-heading text-white">{{ $t('app.title') }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-globe"></i>
          <label class="sr-only">{{ $t('app.language') }}</label>
          <select v-model="localeModel" class="text-slate-900 rounded-lg px-2 py-1">
            <option value="es">{{ $t('lang.es') }}</option>
            <option value="en">{{ $t('lang.en') }}</option>
            <option value="it">{{ $t('lang.it') }}</option>
            <option value="de">{{ $t('lang.de') }}</option>
          </select>
        </div>
      </div>
    </header>

    <main class="container mx-auto flex-1 p-4 md:p-6 max-w-5xl">
      <div class="mb-4">
        <p-steps :model="steps" :activeIndex="stepIndex" readonly />
      </div>

      <section v-if="stepIndex === 0" class="text-center space-y-6">
        <h2 class="kid-heading">{{ $t('home.heading') }}</h2>
        <p class="text-lg text-slate-600">{{ $t('home.description') }}</p>
        <div class="flex flex-wrap justify-center gap-4">
          <p-button :label="$t('home.start')" class="kid-button bg-brand-yellow text-slate-900" @click="nextStep" icon="pi pi-play" />
          <p-button :label="$t('home.tutorial')" class="kid-button bg-brand-blue text-white" severity="info" icon="pi pi-book" @click="showTutorial=true"/>
        </div>
        <TutorialDialog v-model:visible="showTutorial" />
      </section>

      <section v-else-if="stepIndex === 1">
        <CameraScanner
          :requiredOrder="scanOrder"
          v-model:faces="faces"
          v-model:completed="scanCompleted"
        />
        <div class="flex justify-between mt-4">
          <p-button :label="$t('common.reset')" icon="pi pi-refresh" severity="danger" @click="resetAll" />
          <p-button :label="$t('common.continue')" icon="pi pi-arrow-right" :disabled="!scanCompleted" @click="nextStep" />
        </div>
      </section>

      <section v-else-if="stepIndex === 2" class="space-y-4">
        <p-card>
          <template #title>{{ $t('review.title') }}</template>
          <template #content>
            <p class="mb-2">{{ $t('review.desc') }}</p>
            <CubeNet :faces="faces" class="mb-4" />
            <div class="flex justify-between items-center">
              <p-button :label="$t('review.back')" icon="pi pi-arrow-left" @click="prevStep" />
              <div class="flex items-center gap-3">
                <p-button :label="$t('review.validate')" icon="pi pi-check-circle" @click="validateCube" :loading="validating" />
                <p-button :label="$t('review.solve')" icon="pi pi-cog" @click="solveCube" :disabled="!isValid || solving" :loading="solving" />
              </div>
            </div>
            <p class="text-sm text-slate-500 mt-2" v-if="!isValid">{{ $t('review.tip') }}</p>
          </template>
        </p-card>
      </section>

      <section v-else-if="stepIndex === 3">
        <SolutionPlayer
          :moves="moves"
          :faces="faces"
          @reset="resetAll"
        />
        <div class="flex justify-between mt-4">
          <p-button :label="$t('common.back')" icon="pi pi-arrow-left" @click="prevStep" />
          <p-button :label="$t('common.reset')" icon="pi pi-refresh" severity="danger" @click="resetAll" />
        </div>
      </section>
    </main>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Steps from 'primevue/steps';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

import CameraScanner from './components/CameraScanner.vue';
import CubeNet from './components/CubeNet.vue';
import SolutionPlayer from './components/SolutionPlayer.vue';
import TutorialDialog from './components/TutorialDialog.vue';
import { useCubeScan } from './composables/useCubeScan';
import { validateFaces } from './utils/validation';
import { solveFromFaces } from './utils/solver';
import { setHtmlLang } from './i18n';

 type FaceLabel = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

const { t, locale } = useI18n();
const localeModel = computed({
  get: () => locale.value as string,
  set: (v: string) => { locale.value = v as any; localStorage.setItem('locale', v); setHtmlLang(v); }
});

const toast = useToast();
const stepIndex = ref<number>(0);
const showTutorial = ref<boolean>(false);

const steps = computed(() => [
  { label: t('steps.start') },
  { label: t('steps.scan') },
  { label: t('steps.review') },
  { label: t('steps.play') }
]);

const scanOrder: FaceLabel[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const { faces, reset } = useCubeScan(scanOrder);
const scanCompleted = ref<boolean>(false);
const isValid = ref<boolean>(false);
const validating = ref<boolean>(false);
const solving = ref<boolean>(false);
const moves = ref<string[]>([]);

function nextStep() {
  stepIndex.value = Math.min(stepIndex.value + 1, steps.value.length - 1);
}
function prevStep() {
  stepIndex.value = Math.max(stepIndex.value - 1, 0);
}
function resetAll() {
  reset();
  moves.value = [];
  isValid.value = false;
  scanCompleted.value = false;
  stepIndex.value = 0;
}

async function validateCube() {
  validating.value = true;
  try {
    const result = validateFaces(faces.value as any);
    isValid.value = (result as any).valid;
    if ((result as any).valid) {
      toast.add({ severity: 'success', summary: t('toasts.validCube.summary'), detail: t('toasts.validCube.detail'), life: 2500 });
    } else {
      const r: any = result;
      const detail = r?.code ? t(`validation.${r.code}`, r.args || {}) : t('toasts.error.validating');
      toast.add({ severity: 'warn', summary: t('toasts.invalidCube.summary'), detail, life: 4000 });
    }
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: t('toasts.error.summary'), detail: t('toasts.error.validating'), life: 3000 });
  } finally {
    validating.value = false;
  }
}

async function solveCube() {
  solving.value = true;
  try {
    const m = await solveFromFaces(faces.value as any);
    moves.value = m as string[];
    if (!m || (m as string[]).length === 0) {
      toast.add({ severity: 'info', summary: t('toasts.solve.already.summary'), detail: t('toasts.solve.already.detail'), life: 3000 });
    } else {
      toast.add({ severity: 'success', summary: t('toasts.solve.ready.summary'), detail: t('toasts.solve.ready.detail', { count: (m as string[]).length }), life: 2500 });
    }
    stepIndex.value = 3;
  } catch (e: any) {
    console.error(e);
    toast.add({ severity: 'error', summary: t('toasts.solve.failed.summary'), detail: t('toasts.solve.failed.detail'), life: 4000 });
  } finally {
    solving.value = false;
  }
}
</script>

<style scoped>
</style>
