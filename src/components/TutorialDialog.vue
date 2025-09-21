<template>
  <p-dialog :visible="visible" @update:visible="(v) => emit('update:visible', v)" modal :header="$t('tutorial.title')" :style="{ width: '90%', maxWidth: '640px' }">
    <div class="space-y-4">
      <p class="text-lg">{{ $t('tutorial.intro') }}</p>
      <ul class="list-disc pl-6 space-y-2">
        <li>{{ $t('tutorial.items.U') }}</li>
        <li>{{ $t('tutorial.items.D') }}</li>
        <li>{{ $t('tutorial.items.F') }}</li>
        <li>{{ $t('tutorial.items.B') }}</li>
        <li>{{ $t('tutorial.items.R') }}</li>
        <li>{{ $t('tutorial.items.L') }}</li>
      </ul>
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded-xl border bg-white">
          <div class="font-bold mb-1">{{ $t('tutorial.scanTips.title') }}</div>
          <ul class="list-disc pl-6 text-sm space-y-1">
            <li>{{ $t('tutorial.scanTips.a') }}</li>
            <li>{{ $t('tutorial.scanTips.b') }}</li>
            <li>{{ $t('tutorial.scanTips.c') }}</li>
          </ul>
        </div>
        <div class="p-3 rounded-xl border bg-white">
          <div class="font-bold mb-1">{{ $t('tutorial.solveTips.title') }}</div>
          <ul class="list-disc pl-6 text-sm space-y-1">
            <li>{{ $t('tutorial.solveTips.a') }}</li>
            <li>{{ $t('tutorial.solveTips.b') }}</li>
            <li>{{ $t('tutorial.solveTips.c') }}</li>
          </ul>
        </div>
      </div>
      <div class="text-right">
        <p-button :label="$t('tutorial.close')" icon="pi pi-check" @click="close" class="kid-button bg-brand-green text-white" />
      </div>
    </div>
  </p-dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible']);

function close() { emit('update:visible', false); }
</script>
