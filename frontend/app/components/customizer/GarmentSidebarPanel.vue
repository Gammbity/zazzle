<script setup lang="ts">
import { fabric } from 'fabric';
import type { GarmentTab } from '~/types/garment';
import {
  GARMENT_DEFAULT_TEXT,
  GARMENT_DEFAULT_TEXT_FONT_SIZE,
  GARMENT_STICKER_FONT_SIZE,
  GARMENT_STICKERS,
} from '~/lib/garment-presets';

const props = defineProps<{
  canvas: fabric.Canvas | null;
  activeTab: GarmentTab;
}>();

const canvasRef = toRef(props, 'canvas');
const { loadImageFile, MAX_FILE_SIZE_MB, ALLOWED_TYPES } = useCanvasImageLoader(canvasRef);

const TEXT_COLOR_PRESETS = ['#111827', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#ffffff'];

type UploadStatus = 'idle' | 'loading' | 'error';
const uploadStatus = ref<UploadStatus>('idle');
const errorMessage = ref('');
const isDragOver = ref(false);
const textColor = ref('#2563eb');
const fileInputRef = ref<HTMLInputElement | null>(null);

function addCanvasObject(object: fabric.Object) {
  if (!props.canvas) return;
  props.canvas.add(object);
  props.canvas.setActiveObject(object);
  props.canvas.requestRenderAll();
}

function centerOnCanvas(object: fabric.Object, extra: Record<string, unknown> = {}) {
  if (!props.canvas) return;
  object.set({
    left: props.canvas.getWidth() / 2,
    top: props.canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    ...extra,
  });
  object.setCoords();
}

async function loadImageToCanvas(file: File) {
  uploadStatus.value = 'loading';
  errorMessage.value = '';
  const result = await loadImageFile(file);
  if (!result.ok) {
    uploadStatus.value = 'error';
    errorMessage.value = result.error ?? 'Faylni yuklab bo\'lmadi.';
    return;
  }
  uploadStatus.value = 'idle';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function handleFileInputChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) void loadImageToCanvas(file);
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) void loadImageToCanvas(file);
}

function applyTextColor(color: string) {
  textColor.value = color;
  const active = props.canvas?.getActiveObject();
  if (!active) return;
  if (['i-text', 'textbox', 'text'].includes(active.type ?? '')) {
    active.set('fill', color);
    props.canvas?.requestRenderAll();
    props.canvas?.fire('object:modified', { target: active });
  }
}

function handleAddText() {
  if (!props.canvas) return;
  const text = new fabric.IText(GARMENT_DEFAULT_TEXT, {
    fontFamily: 'sans-serif',
    fontSize: GARMENT_DEFAULT_TEXT_FONT_SIZE,
    fill: textColor.value,
    selectable: true,
    evented: true,
  });
  (text as fabric.IText & { customType?: string }).customType = 'text';
  centerOnCanvas(text);
  addCanvasObject(text);
  text.enterEditing();
  text.selectAll();
}

function handleAddSticker(sticker: string) {
  if (!props.canvas) return;
  const text = new fabric.Text(sticker, { fontSize: GARMENT_STICKER_FONT_SIZE, selectable: true, evented: true });
  (text as fabric.Text & { customType?: string }).customType = 'emoji';
  centerOnCanvas(text);
  addCanvasObject(text);
}
</script>

<template>
  <div class="p-4">
    <div v-if="activeTab === 'image'">
      <input
        ref="fileInputRef"
        type="file"
        :accept="ALLOWED_TYPES.join(',')"
        hidden
        @change="handleFileInputChange"
      >

      <div
        class="relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition"
        :class="[
          isDragOver ? 'border-secondary-400 bg-secondary-50' : 'border-brand-border bg-brand-surface-low/60',
          uploadStatus === 'error' ? 'border-rose-300 bg-rose-50' : '',
        ]"
        role="button"
        tabindex="0"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="fileInputRef?.click()"
        @keydown.enter="fileInputRef?.click()"
      >
        <template v-if="uploadStatus === 'loading'">
          <Icon
            name="lucide:loader-2"
            class="h-8 w-8 animate-spin text-secondary-600"
          />
          <p class="text-sm text-brand-muted">
            Yuklanmoqda...
          </p>
        </template>
        <template v-else-if="uploadStatus === 'error'">
          <Icon
            name="lucide:alert-circle"
            class="h-8 w-8 text-rose-500"
          />
          <p class="text-sm font-medium text-rose-600">
            {{ errorMessage }}
          </p>
          <span class="text-xs text-brand-muted">Qayta urinish</span>
        </template>
        <template v-else>
          <Icon
            name="lucide:upload-cloud"
            class="h-8 w-8 text-brand-muted"
          />
          <p class="text-sm text-slate-700">
            <strong class="font-semibold">Rasm tashlang</strong> yoki bosing
          </p>
          <span class="text-xs text-brand-muted">PNG, JPG, WebP - eng ko'pi {{ MAX_FILE_SIZE_MB }} MB</span>
        </template>
      </div>
    </div>

    <div v-else-if="activeTab === 'text'">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-secondary-700"
        @click="handleAddText"
      >
        <Icon
          name="lucide:type"
          class="h-4 w-4"
        /> Yangi matn qo'shish
      </button>
      <div class="mt-4">
        <p class="mb-2.5 text-sm font-semibold text-slate-900">
          Matn rangi
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="color"
            :value="textColor"
            class="h-8 w-8 cursor-pointer rounded-full border border-brand-border/60 p-0.5"
            aria-label="Matn rangini tanlash"
            @input="applyTextColor(($event.target as HTMLInputElement).value)"
          >
          <button
            v-for="color in TEXT_COLOR_PRESETS"
            :key="color"
            type="button"
            class="h-8 w-8 rounded-full border-2 transition hover:scale-105"
            :style="{ backgroundColor: color, borderColor: textColor.toLowerCase() === color.toLowerCase() ? '#0f172a' : '#ffffff' }"
            :title="color"
            @click="applyTextColor(color)"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="activeTab === 'stickers'"
      class="grid grid-cols-4 gap-2"
    >
      <button
        v-for="sticker in GARMENT_STICKERS"
        :key="sticker"
        type="button"
        class="flex aspect-square items-center justify-center rounded-xl border border-brand-border/50 bg-white text-2xl transition hover:bg-brand-surface-low"
        @click="handleAddSticker(sticker)"
      >
        {{ sticker }}
      </button>
    </div>

    <div v-else-if="activeTab === 'product'">
      <p class="text-sm text-brand-muted">
        Tez orada qo'shiladi.
      </p>
    </div>
  </div>
</template>
