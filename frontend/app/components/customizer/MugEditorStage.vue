<script setup lang="ts">
import { fabric } from 'fabric';
import { MUG_EDITOR_CANVAS_HEIGHT, MUG_EDITOR_CANVAS_WIDTH, MUG_HANDLE_MARGIN_PX } from '~/lib/mugPrintConstants';

const props = defineProps<{ mugColor: string }>();
const emit = defineEmits<{ 'canvas-ready': [canvas: fabric.Canvas] }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvas = shallowRef<fabric.Canvas | null>(null);
const modelRef = ref<{ updateTexture: (dataUrl: string) => void } | null>(null);
const textureDataUrl = ref<string | null>(null);

const canvasSize = ref({ width: MUG_EDITOR_CANVAS_WIDTH, height: MUG_EDITOR_CANVAS_HEIGHT });
const alignmentGuides = useAlignmentGuides(canvas, canvasSize);

let syncScheduled = false;
function syncTexture() {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(() => {
    syncScheduled = false;
    if (!canvas.value) return;
    const dataUrl = canvas.value.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    textureDataUrl.value = dataUrl;
    modelRef.value?.updateTexture(dataUrl);
    // `toDataURL` resizes the canvas element internally to apply the
    // multiplier (see fabric's `toCanvasElement`), which clears the visible
    // on-screen bitmap as a side effect of the resize — without this, the
    // flat print-area card would stay blank after the very first sync even
    // though the 3D texture (captured before the clear) keeps updating.
    canvas.value.requestRenderAll();
  });
}

function keepInsidePrintArea(event: fabric.IEvent) {
  const object = event.target;
  if (!object || !canvas.value) return;
  const bounds = object.getBoundingRect(true, true);
  if (bounds.width > MUG_EDITOR_CANVAS_WIDTH - MUG_HANDLE_MARGIN_PX * 2) {
    const factor = (MUG_EDITOR_CANVAS_WIDTH - MUG_HANDLE_MARGIN_PX * 2) / bounds.width;
    object.scaleX = (object.scaleX ?? 1) * factor;
  }
  if (bounds.height > MUG_EDITOR_CANVAS_HEIGHT) {
    object.scaleY = (object.scaleY ?? 1) * (MUG_EDITOR_CANVAS_HEIGHT / bounds.height);
  }
  object.setCoords();
  const next = object.getBoundingRect(true, true);
  const minX = MUG_HANDLE_MARGIN_PX;
  const maxX = MUG_EDITOR_CANVAS_WIDTH - MUG_HANDLE_MARGIN_PX;
  let dx = 0;
  let dy = 0;
  if (next.left < minX) dx = minX - next.left;
  if (next.left + next.width > maxX) dx = maxX - (next.left + next.width);
  if (next.top < 0) dy = -next.top;
  if (next.top + next.height > MUG_EDITOR_CANVAS_HEIGHT) dy = MUG_EDITOR_CANVAS_HEIGHT - (next.top + next.height);
  object.left = (object.left ?? 0) + dx;
  object.top = (object.top ?? 0) + dy;
  object.setCoords();
}

onMounted(() => {
  if (!canvasRef.value) return;
  const instance = new fabric.Canvas(canvasRef.value, {
    width: MUG_EDITOR_CANVAS_WIDTH,
    height: MUG_EDITOR_CANVAS_HEIGHT,
    backgroundColor: props.mugColor,
    preserveObjectStacking: true,
    selectionBorderColor: '#ea580c',
    selectionLineWidth: 2,
    controlsAboveOverlay: true,
    skipOffscreen: false,
    enableRetinaScaling: false,
  });
  // See the matching note in GarmentStage.vue — fabric's inline pixel-size
  // style can overflow a narrower card; cssOnly keeps the display size in
  // sync with the actual rendered card without touching the coordinate
  // space.
  instance.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });

  fabric.Object.prototype.set({
    cornerSize: 12,
    transparentCorners: false,
    cornerColor: '#ea580c',
    cornerStrokeColor: '#ffffff',
    borderColor: '#ea580c',
    hasRotatingPoint: true,
    rotatingPointOffset: 25,
    snapAngle: 45,
    snapThreshold: 6,
  });

  instance.on('object:added', syncTexture);
  instance.on('object:modified', syncTexture);
  instance.on('object:moving', (event) => {
    keepInsidePrintArea(event);
    syncTexture();
  });
  instance.on('object:scaling', (event) => {
    keepInsidePrintArea(event);
    syncTexture();
  });
  instance.on('object:rotating', syncTexture);
  instance.on('object:removed', syncTexture);
  alignmentGuides.attach(instance);
  canvas.value = instance;
  emit('canvas-ready', instance);
  syncTexture();
});

watch(() => props.mugColor, (color) => {
  if (!canvas.value) return;
  canvas.value.setBackgroundColor(color, () => {
    canvas.value?.requestRenderAll();
    syncTexture();
  });
});

onBeforeUnmount(() => {
  if (canvas.value) alignmentGuides.detach(canvas.value);
  canvas.value?.dispose();
});
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-4">
    <div class="relative flex min-h-[280px] w-full max-w-[620px] items-center justify-center overflow-hidden rounded-[20px] border border-brand-border/50 bg-slate-200 p-4 shadow-sm sm:min-h-[360px]">
      <MugPreview3D
        ref="modelRef"
        :texture-data-url="textureDataUrl"
        :mug-color="mugColor"
      />
    </div>

    <div class="w-full max-w-[620px] rounded-2xl border border-brand-border/60 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-900">
            Bosma hududi
          </p>
        </div>
      </div>
      <div
        class="relative mx-auto w-full overflow-visible rounded-lg border-2 border-slate-300 bg-white"
        style="max-width: 540px; aspect-ratio: 2.7 / 1;"
      >
        <canvas
          ref="canvasRef"
          class="block h-full w-full"
        />
        <div class="pointer-events-none absolute inset-y-0 left-0 w-[3.33%] rounded-l-md bg-slate-900/5" />
        <div class="pointer-events-none absolute inset-y-0 right-0 w-[3.33%] rounded-r-md bg-slate-900/5" />
        <div class="pointer-events-none absolute inset-y-0 left-[3.33%] border-l border-dashed border-secondary-500" />
        <div class="pointer-events-none absolute inset-y-0 right-[3.33%] border-r border-dashed border-secondary-500" />
      </div>
    </div>
  </div>
</template>
