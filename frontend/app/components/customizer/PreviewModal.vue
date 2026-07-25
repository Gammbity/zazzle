<script setup lang="ts">
import type { GarmentType } from '~/types/garment';

// URL-backed modal: state lives in `?preview=1` on the current route, not
// just a local ref. A refresh while this is open re-reads the query and
// reopens the modal instead of dumping the user back onto a blank editor —
// the design itself is untouched either way since the fabric canvas
// autosaves to localStorage on every edit (see useFabricHistory). Shows the
// real 3D model with the design decal-projected onto its surface —
// rotatable by dragging, unlike the fixed flat editor view.
const props = defineProps<{
  garment: GarmentType;
  frontDataUrl: string | null;
  backDataUrl: string | null;
  shirtColor: string;
  ready: boolean;
  frontPrintArea: { top: number; left: number; width: number; height: number };
  backPrintArea: { top: number; left: number; width: number; height: number } | null;
}>();
const emit = defineEmits<{ close: [] }>();

// Entrance/exit are driven by a local `visible` flag rather than the
// parent's v-if directly — the parent unmounts this component immediately
// on `close`, which would cut off any exit animation before it plays. This
// component appears already-mounted, flips `visible` true on next tick to
// trigger the enter transition, then on close flips it false and waits for
// the CSS transition to finish before telling the parent to unmount it.
const visible = ref(false);
const TRANSITION_MS = 220;

onMounted(() => {
  document.addEventListener('keydown', handleEsc);
  requestAnimationFrame(() => {
    visible.value = true;
  });
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEsc);
});

function requestClose() {
  visible.value = false;
  setTimeout(() => emit('close'), TRANSITION_MS);
}

function handleBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) requestClose();
}
function handleEsc(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose();
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity duration-200 ease-out"
      :class="visible ? 'opacity-100' : 'opacity-0'"
      @click="handleBackdrop"
    >
      <div
        class="flex h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-200 ease-out"
        :class="visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'"
      >
        <div class="flex items-center justify-between border-b border-brand-border/50 px-5 py-4">
          <button
            type="button"
            class="flex items-center gap-1.5 text-sm font-semibold text-brand-muted transition hover:text-slate-900"
            @click="requestClose()"
          >
            <Icon
              name="lucide:chevron-left"
              class="h-4 w-4"
            /> Tahrirlashga qaytish
          </button>
          <h2 class="text-sm font-bold text-slate-900">
            3D ko'rinish
          </h2>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-surface-low"
            aria-label="Yopish"
            @click="requestClose()"
          >
            <Icon
              name="lucide:x"
              class="h-4 w-4"
            />
          </button>
        </div>

        <div class="flex-1 overflow-hidden bg-brand-surface-low">
          <GarmentPreview3D
            v-if="props.ready"
            :garment="props.garment"
            :front-data-url="props.frontDataUrl"
            :back-data-url="props.backDataUrl"
            :shirt-color="props.shirtColor"
            :front-print-area="props.frontPrintArea"
            :back-print-area="props.backPrintArea"
          />
          <div
            v-else
            class="flex h-full flex-col items-center justify-center gap-3 text-brand-muted"
          >
            <Icon
              name="lucide:loader-2"
              class="h-8 w-8 animate-spin"
            />
            <p class="text-sm">
              Preview tayyorlanmoqda…
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
