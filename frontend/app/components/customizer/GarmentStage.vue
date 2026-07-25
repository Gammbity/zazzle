<script setup lang="ts">
import { fabric } from 'fabric';
import type { GarmentSide, GarmentType } from '~/types/garment';
import { garmentHasBack, getGarmentAsset, getGarmentCanvasSize } from '~/lib/garment-presets';

const props = defineProps<{
  garment: GarmentType;
  viewSide: GarmentSide;
  shirtColor: string;
  hasSelection: boolean;
}>();

const emit = defineEmits<{
  'update:viewSide': [side: GarmentSide];
  'canvas-ready': [canvas: fabric.Canvas];
  'delete': [];
}>();

const canvasElRef = ref<HTMLCanvasElement | null>(null);
const fabricCanvas = shallowRef<fabric.Canvas | null>(null);

const asset = computed(() => getGarmentAsset(props.garment, props.viewSide));
const canvasSize = computed(() => getGarmentCanvasSize(props.garment, props.viewSide));
const hasBack = computed(() => garmentHasBack(props.garment));

const alignmentGuides = useAlignmentGuides(fabricCanvas, canvasSize);

type Model3DHandle = { updateTexture: (dataUrl: string) => void; exportSnapshot: () => string };
const model3dRef = ref<Model3DHandle | null>(null);

defineExpose({ exportSnapshot: () => model3dRef.value?.exportSnapshot() ?? null });

// Pushes the current canvas content to the 3D preview's decal texture.
// Gated behind a single in-flight rAF so a burst of events during a drag
// only pushes one texture update per frame instead of flooding the GPU
// upload.
let textureSyncScheduled = false;
function scheduleTextureSync() {
  if (textureSyncScheduled) return;
  textureSyncScheduled = true;
  requestAnimationFrame(() => {
    textureSyncScheduled = false;
    const c = fabricCanvas.value;
    if (!c || !model3dRef.value) return;
    model3dRef.value.updateTexture(c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }));
    // `toDataURL` resizes the canvas internally to apply the multiplier,
    // which clears the on-screen bitmap as a side effect of that resize —
    // without this, the flat card would go blank after the first sync.
    c.requestRenderAll();
  });
}

onMounted(() => {
  if (!canvasElRef.value) return;

  const canvas = new fabric.Canvas(canvasElRef.value, {
    width: canvasSize.value.width,
    height: canvasSize.value.height,
    backgroundColor: 'transparent',
    preserveObjectStacking: true,
    selectionBorderColor: '#ea580c',
    selectionLineWidth: 2,
    controlsAboveOverlay: true,
    selection: true,
    skipOffscreen: false,
  });
  // Fabric sets an inline `style="width:...px;height:...px"` on the canvas
  // matching its internal drawing resolution, which wins over the
  // `h-full w-full` Tailwind classes on the card whenever that card
  // renders narrower than the canvas's native size (smaller viewports) —
  // the canvas would overflow the visible card and clicks/handles would
  // land outside it. `cssOnly` rescales only the *display* size to fill
  // the card, leaving the canvasSize coordinate space untouched.
  canvas.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });

  fabric.Object.prototype.set({
    cornerSize: 12,
    transparentCorners: false,
    cornerColor: '#ea580c',
    cornerStrokeColor: '#ffffff',
    borderColor: '#ea580c',
    borderScaleFactor: 1,
    hasRotatingPoint: true,
    rotatingPointOffset: 25,
    snapAngle: 45,
    snapThreshold: 6,
  });

  // Keep objects fully inside the card: dragging stops at the edge,
  // scaling can never grow an object past the canvas in either axis.
  const constrainToCanvas = (e: fabric.IEvent) => {
    const obj = e.target;
    if (!obj) return;
    const { width: canvasW, height: canvasH } = canvasSize.value;

    const bound = obj.getBoundingRect(true, true);
    if (bound.width > canvasW) obj.scaleX = (obj.scaleX ?? 1) * (canvasW / bound.width);
    if (bound.height > canvasH) obj.scaleY = (obj.scaleY ?? 1) * (canvasH / bound.height);
    obj.setCoords();

    const clamped = obj.getBoundingRect(true, true);
    let dx = 0;
    let dy = 0;
    if (clamped.left < 0) dx = -clamped.left;
    else if (clamped.left + clamped.width > canvasW) dx = canvasW - (clamped.left + clamped.width);
    if (clamped.top < 0) dy = -clamped.top;
    else if (clamped.top + clamped.height > canvasH) dy = canvasH - (clamped.top + clamped.height);
    if (dx || dy) {
      obj.left = (obj.left ?? 0) + dx;
      obj.top = (obj.top ?? 0) + dy;
      obj.setCoords();
    }
  };
  canvas.on('object:moving', constrainToCanvas);
  canvas.on('object:scaling', constrainToCanvas);
  canvas.on('object:added', scheduleTextureSync);
  canvas.on('object:modified', scheduleTextureSync);
  canvas.on('object:moving', scheduleTextureSync);
  canvas.on('object:scaling', scheduleTextureSync);
  canvas.on('object:rotating', scheduleTextureSync);
  canvas.on('object:removed', scheduleTextureSync);
  alignmentGuides.attach(canvas);

  fabricCanvas.value = canvas;
  emit('canvas-ready', canvas);
});

onBeforeUnmount(() => {
  if (fabricCanvas.value) alignmentGuides.detach(fabricCanvas.value);
  fabricCanvas.value?.dispose();
});
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-4">
    <div class="flex items-center gap-1 rounded-full border border-brand-border/50 bg-white p-1 shadow-sm">
      <template v-if="hasBack">
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150"
          :class="viewSide === 'front' ? 'bg-secondary-600 text-white' : 'text-brand-muted hover:text-slate-900'"
          @click="emit('update:viewSide', 'front')"
        >
          Old tomoni
        </button>
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150"
          :class="viewSide === 'back' ? 'bg-secondary-600 text-white' : 'text-brand-muted hover:text-slate-900'"
          @click="emit('update:viewSide', 'back')"
        >
          Orqa tomoni
        </button>
        <span class="mx-0.5 h-5 w-px bg-brand-border/60" />
      </template>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-full text-rose-500 transition-colors duration-150 hover:bg-rose-50 disabled:opacity-30"
        :disabled="!hasSelection"
        title="O'chirish"
        @click="emit('delete')"
      >
        <Icon
          name="lucide:trash-2"
          class="h-4 w-4"
        />
      </button>
    </div>

    <div class="relative flex min-h-[280px] w-full max-w-[480px] items-center justify-center overflow-hidden rounded-[20px] border border-brand-border/50 bg-slate-200 p-4 shadow-sm sm:min-h-[360px]">
      <GarmentEditorModel3D
        ref="model3dRef"
        :garment="garment"
        :view-side="viewSide"
        :shirt-color="shirtColor"
        :print-area="asset.printArea"
      />
    </div>

    <div class="w-full max-w-[480px] rounded-2xl border border-brand-border/60 bg-white p-4 shadow-sm">
      <p class="mb-3 text-sm font-semibold text-slate-900">
        Bosma hududi
      </p>
      <div
        class="relative mx-auto w-full overflow-visible rounded-lg border-2 border-slate-300 bg-white"
        :style="{ maxWidth: `${canvasSize.width}px`, aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }"
      >
        <canvas
          ref="canvasElRef"
          class="block h-full w-full"
        />
      </div>
    </div>
  </div>
</template>
