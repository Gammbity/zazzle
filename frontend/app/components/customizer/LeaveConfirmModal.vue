<script setup lang="ts">
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const visible = ref(false);
const TRANSITION_MS = 180;

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true;
  });
});

function requestCancel() {
  visible.value = false;
  setTimeout(() => emit('cancel'), TRANSITION_MS);
}
function requestConfirm() {
  visible.value = false;
  setTimeout(() => emit('confirm'), TRANSITION_MS);
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity duration-[180ms] ease-out"
      :class="visible ? 'opacity-100' : 'opacity-0'"
      @click.self="requestCancel"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all duration-[180ms] ease-out"
        :class="visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'"
      >
        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
          <Icon
            name="lucide:triangle-alert"
            class="h-5 w-5 text-amber-600"
          />
        </div>
        <p class="text-sm font-semibold text-slate-900">
          Hozirgi holat o'chiriladi. Boshidan boshlashingizga to'g'ri keladi.
        </p>
        <div class="mt-5 flex items-center gap-2">
          <button
            type="button"
            class="flex h-10 flex-1 items-center justify-center rounded-xl border border-brand-border/60 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
            @click="requestCancel"
          >
            Qolish
          </button>
          <button
            type="button"
            class="flex h-10 flex-1 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700"
            @click="requestConfirm"
          >
            Chiqish
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
