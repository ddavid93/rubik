<template>
  <div>
    <p-card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-list-check text-brand-blue"></i>
          <span>{{ $t('solution.title') }}</span>
        </div>
      </template>
      <template #content>
        <div v-if="moves && moves.length" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-lg font-bold">{{ $t('solution.stepCounter', { current: currentIndex + 1, total: moves.length }) }}</div>
            <p-tag severity="info" :value="moves[currentIndex]" class="text-xl px-3 py-2" />
          </div>

          <div class="flex flex-col items-center gap-4">
            <MoveCard :move="moves[currentIndex]" />
            <div class="flex gap-3">
              <p-button :label="$t('solution.prev')" icon="pi pi-arrow-left" @click="prev" :disabled="currentIndex === 0" />
              <p-button :label="$t('solution.next')" icon="pi pi-arrow-right" @click="next" :disabled="currentIndex >= moves.length - 1" />
            </div>
            <div class="text-sm text-slate-500">{{ $t('solution.hint') }}</div>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <div class="text-xl font-semibold">{{ $t('solution.emptyTitle') }}</div>
          <p-button :label="$t('solution.rescan')" icon="pi pi-refresh" class="mt-4" @click="$emit('reset')" />
        </div>
      </template>
    </p-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import confetti from 'canvas-confetti';
import { useI18n } from 'vue-i18n';

 type Props = {
  moves: string[];
  faces: Record<string, any>;
};

const props = defineProps<Props>();

const emit = defineEmits(['reset']);

const currentIndex = ref<number>(0);
const { t } = useI18n();

function blast() {
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
}

function next() {
  if (currentIndex.value < props.moves.length - 1) {
    currentIndex.value++;
    if (currentIndex.value === props.moves.length - 1) {
      // last step arrived
      setTimeout(() => blast(), 300);
    }
  }
}
function prev() {
  if (currentIndex.value > 0) currentIndex.value--;
}

watch(() => props.moves, () => { currentIndex.value = 0; });

// Small visual card explaining a move without JSX
const MoveCard = {
  props: { move: { type: String, required: true } },
  setup(p: { move: string }) {
    return () => h(
      'div',
      { class: 'p-4 border rounded-2xl bg-white w-full max-w-sm text-center shadow' },
      [
        h('div', { class: 'text-6xl font-black' }, p.move),
        h('div', { class: 'mt-2 text-slate-600' }, [
          t('move.turn', { face: t(`move.faces.${(p.move || '').charAt(0)}`), dir: turnText(p.move) })
        ]),
        h('div', { class: 'mt-2 text-xs text-slate-500' }, t('move.advice'))
      ]
    );
  }
};

function turnText(m?: string) {
  if (!m) return '';
  if (m.includes("2")) return t('move.dir.twice') as string;
  if (m.includes("'")) return t('move.dir.left') as string;
  return t('move.dir.right') as string;
}
</script>
