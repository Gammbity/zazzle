<script setup lang="ts">
import type { fabric } from 'fabric';
import type { GarmentSide, GarmentTab, GarmentType } from '~/types/garment';
import { garmentHasBack, getGarmentAsset, getGarmentCanvasSize } from '~/lib/garment-presets';
import { renderFabricDraftToDataUrl } from '~/lib/renderFabricDraft';

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const slug = computed(() => String(route.params.slug));

const PRODUCT_LABELS: Record<string, string> = {
  't-shirt': 'Futbolka',
  'hoodie': 'Hoodie',
  'mug': 'Krujka',
};
const isGarment = computed(() => slug.value === 't-shirt' || slug.value === 'hoodie');
const isMug = computed(() => slug.value === 'mug');
const isSupported = computed(() => isGarment.value || isMug.value);
const garment = computed<GarmentType>(() => (slug.value === 'hoodie' ? 'hoodie' : 't-shirt'));
const productLabel = computed(() => PRODUCT_LABELS[slug.value] ?? slug.value);

useHead({ title: productLabel });

// ── Editor state ──────────────────────────────────────────────────────────
const viewSide = ref<GarmentSide>('front');
const shirtColor = ref('#ffffff');
const activeTab = ref<GarmentTab>('image');
const fabricCanvas = shallowRef<fabric.Canvas | null>(null);

const draftKey = computed(() => `zazzle:editor:${slug.value}:${viewSide.value}`);
const history = useFabricHistory(fabricCanvas, draftKey);

watch(viewSide, () => {
  // Re-attach history to the new side's own draft (front/back are edited
  // and saved independently, matching the old frontend's behavior).
  history.detach(fabricCanvas.value!);
  history.attach(fabricCanvas.value!);
}, { flush: 'post' });

function handleCanvasReady(canvas: fabric.Canvas) {
  fabricCanvas.value = canvas;
  history.attach(canvas);
}
onBeforeUnmount(() => {
  if (fabricCanvas.value) history.detach(fabricCanvas.value);
});

function handleDelete() {
  const c = fabricCanvas.value;
  const active = c?.getActiveObject();
  if (!c || !active) return;
  c.remove(active);
  c.discardActiveObject();
  c.requestRenderAll();
}

// ── Preview modal, backed by the URL so a refresh never strands the user ──
// Shows the real 3D model, so it needs BOTH sides' designs as separate
// textures — the live canvas covers whichever side is active; the other
// side's last-saved draft is re-rendered off-screen to a texture.
const previewOpen = computed(() => route.query.preview === '1');
const frontTextureUrl = ref<string | null>(null);
const backTextureUrl = ref<string | null>(null);
const previewReady = ref(false);
const busy = ref<'preview' | 'export' | null>(null);

async function buildPreviewTextures() {
  const c = fabricCanvas.value;
  if (!c) return;

  const liveUrl = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  const otherSide: GarmentSide = viewSide.value === 'front' ? 'back' : 'front';

  let otherUrl: string | null = null;
  if (garmentHasBack(garment.value)) {
    const otherDraftKey = `zazzle:editor:${slug.value}:${otherSide}`;
    const saved = window.localStorage.getItem(otherDraftKey);
    if (saved) {
      const otherCanvasSize = getGarmentCanvasSize(garment.value, otherSide);
      otherUrl = await renderFabricDraftToDataUrl(saved, otherCanvasSize.width, otherCanvasSize.height).catch(() => null);
    }
  }

  if (viewSide.value === 'front') {
    frontTextureUrl.value = liveUrl;
    backTextureUrl.value = otherUrl;
  }
  else {
    backTextureUrl.value = liveUrl;
    frontTextureUrl.value = otherUrl;
  }
  previewReady.value = true;
}

async function openPreview() {
  if (isMug.value) return;
  busy.value = 'preview';
  try {
    await buildPreviewTextures();
    await router.push({ query: { ...route.query, preview: '1' } });
  }
  finally {
    busy.value = null;
  }
}

function closePreview() {
  const { preview: _preview, ...rest } = route.query;
  void router.push({ query: rest });
  // Next "Preview" click rebuilds from the (possibly edited) canvas instead
  // of reusing whatever was rendered last time.
  previewReady.value = false;
}

// Refresh-while-open: query says the modal should be visible before the
// canvas is ready — build the textures as soon as it comes online.
watch([previewOpen, fabricCanvas], async ([open, canvas]) => {
  if (open && canvas && !previewReady.value) {
    await buildPreviewTextures();
  }
}, { immediate: true });

const garmentStageRef = ref<{ exportSnapshot: () => string | null } | null>(null);

async function handleExport() {
  busy.value = 'export';
  try {
    const flattened = isMug.value
      ? fabricCanvas.value?.toDataURL({ format: 'png', quality: 1, multiplier: 2 }) ?? null
      : garmentStageRef.value?.exportSnapshot() ?? null;
    if (flattened) {
      const link = document.createElement('a');
      link.download = 'dizayn-eksport.png';
      link.href = flattened;
      link.click();
    }
  }
  finally {
    busy.value = null;
  }
}

function handleClearDesign() {
  history.clearDesign();
}

// ── Leave-editor confirmation ──────────────────────────────────────────────
// In-app navigation (the "Mahsulotlar" back link, "Buyurtmani davom
// ettirish", etc.) is caught by the router guard; closing the tab/refreshing
// is caught separately by `beforeunload` since router guards don't run for
// full page unloads.
function hasDesignContent() {
  return (fabricCanvas.value?.getObjects().length ?? 0) > 0;
}

const showLeaveConfirm = ref(false);
let leaveConfirmed = false;
let resolveLeaveGuard: ((allow: boolean) => void) | null = null;

onBeforeRouteLeave(() => {
  if (leaveConfirmed || !hasDesignContent()) return true;
  showLeaveConfirm.value = true;
  return new Promise<boolean>((resolve) => {
    resolveLeaveGuard = resolve;
  });
});

function confirmLeave() {
  leaveConfirmed = true;
  showLeaveConfirm.value = false;
  // The confirmation modal already told the user this design won't be
  // kept — once they actually confirm leaving, clear both sides' drafts
  // so the editor starts fresh next time instead of resurrecting a
  // design the user just chose to abandon.
  try {
    window.localStorage.removeItem(`zazzle:editor:${slug.value}:front`);
    window.localStorage.removeItem(`zazzle:editor:${slug.value}:back`);
  }
  catch {
    // Ignore unavailable browser storage.
  }
  resolveLeaveGuard?.(true);
}
function cancelLeave() {
  showLeaveConfirm.value = false;
  resolveLeaveGuard?.(false);
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasDesignContent()) return;
  event.preventDefault();
  event.returnValue = '';
}
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
</script>

<template>
  <div
    v-if="!isSupported"
    class="flex min-h-screen items-center justify-center px-6 text-center"
  >
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-700">
        {{ slug }}
      </p>
      <h1 class="mt-4 text-2xl font-bold text-slate-900">
        Bu mahsulot editori tayyorlanmoqda
      </h1>
      <NuxtLink
        to="/#products"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary-600 px-5 py-3 text-sm font-bold text-white"
      >Mahsulotlarga qaytish</NuxtLink>
    </div>
  </div>

  <div
    v-else
    class="flex min-h-screen flex-col bg-brand-bg"
  >
    <GarmentHeader
      :title="`${productLabel} editori`"
      :show-preview="isGarment"
      :can-undo="history.canUndo.value"
      :can-redo="history.canRedo.value"
      :busy="busy"
      @undo="history.undo"
      @redo="history.redo"
      @preview="openPreview"
      @export="handleExport"
    />

    <main class="flex min-h-0 flex-1 flex-col md:flex-row">
      <div class="flex w-full shrink-0 flex-col overflow-y-auto border-b border-brand-border/50 bg-white md:w-[300px] md:border-b-0 md:border-r">
        <GarmentRail
          :active-tab="activeTab"
          @change="activeTab = $event"
        />
        <GarmentSidebarPanel
          :canvas="fabricCanvas"
          :active-tab="activeTab"
        />
        <GarmentLayersPanel
          :canvas="fabricCanvas"
          :canvas-version="history.canvasVersion.value"
          :view-side="isGarment ? viewSide : undefined"
        />
      </div>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-hidden">
        <GarmentStage
          v-if="isGarment"
          ref="garmentStageRef"
          :garment="garment"
          :view-side="viewSide"
          :shirt-color="shirtColor"
          :has-selection="history.hasSelection.value"
          @update:view-side="viewSide = $event"
          @canvas-ready="handleCanvasReady"
          @delete="handleDelete"
        />
        <MugEditorStage
          v-else
          :mug-color="shirtColor"
          @canvas-ready="handleCanvasReady"
        />
      </div>

      <GarmentPurchasePanel
        :canvas="fabricCanvas"
        :canvas-version="history.canvasVersion.value"
        :product-label="productLabel"
        :shirt-color="shirtColor"
        :product-slug="slug"
        @update:shirt-color="shirtColor = $event"
        @clear-design="handleClearDesign"
      />
    </main>

    <PreviewModal
      v-if="previewOpen"
      :garment="garment"
      :front-data-url="frontTextureUrl"
      :back-data-url="backTextureUrl"
      :shirt-color="shirtColor"
      :ready="previewReady"
      :front-print-area="getGarmentAsset(garment, 'front').printArea"
      :back-print-area="garmentHasBack(garment) ? getGarmentAsset(garment, 'back').printArea : null"
      @close="closePreview"
    />

    <LeaveConfirmModal
      v-if="showLeaveConfirm"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
