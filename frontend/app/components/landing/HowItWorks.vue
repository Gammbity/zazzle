<script setup lang="ts">
const steps = [
  { icon: 'lucide:shirt', label: 'Mahsulotni tanlang' },
  { icon: 'lucide:upload-cloud', label: 'Rasm yuklang' },
  { icon: 'lucide:pen-line', label: 'Dizaynni moslang' },
  { icon: 'lucide:eye', label: 'Previewni ko\'ring' },
  { icon: 'lucide:package-check', label: 'Buyurtma bering' },
];
</script>

<template>
  <section
    id="how-it-works"
    class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
  >
    <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
      Qanday ishlaydi?
    </h2>

    <div class="relative mt-8">
      <!-- Single line spans icon-center to icon-center exactly: with 5
           equal flex cells, the first/last icon centers sit at 10%/90%. -->
      <div
        class="absolute left-[10%] right-[10%] top-7 hidden border-t-2 border-dashed border-brand-border sm:block"
        aria-hidden="true"
      />

      <div class="relative flex flex-col gap-8 sm:flex-row sm:gap-0">
        <div
          v-for="step in steps"
          :key="step.label"
          class="flex flex-1 flex-col items-center gap-3 text-center"
        >
          <span class="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600 ring-8 ring-brand-bg">
            <Icon
              :name="step.icon"
              class="h-6 w-6"
            />
          </span>
          <p class="text-sm font-semibold text-slate-800">
            {{ step.label }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
