<script setup lang="ts">
import type { fabric } from 'fabric';
import type { GarmentSide } from '~/types/garment';

const props = defineProps<{
  canvas: fabric.Canvas | null;
  canvasVersion: number;
  // Only used for the small "Old/Orqa tomoni" heading — the list itself is
  // always just the currently active side's own layers (whichever side is
  // selected on the model), never both sides at once.
  viewSide?: GarmentSide;
}>();

interface LayerItem {
  id: string;
  label: string;
  thumbnail: string | null;
  visible: boolean;
  object: fabric.Object;
}

function layerLabel(kind: string | undefined, fallbackType: string | undefined): string {
  if (kind === 'image') return 'Rasm';
  if (kind === 'emoji') return 'Emoji';
  if (kind === 'text') return 'Matn';
  // Fallback for objects created before `customType` tagging existed.
  return fallbackType === 'image' ? 'Rasm' : 'Matn';
}

const items = computed<LayerItem[]>(() => {
  void props.canvasVersion;
  if (!props.canvas) return [];
  return [...props.canvas.getObjects()].reverse().map((o, i) => ({
    id: `${i}`,
    label: layerLabel((o as fabric.Object & { customType?: string }).customType, o.type),
    thumbnail: o.type === 'image' ? ((o as fabric.Image).getSrc?.() ?? null) : null,
    visible: o.visible !== false,
    object: o,
  }));
});

const sideHeading = computed(() => {
  if (props.viewSide === 'front') return 'Old tomoni';
  if (props.viewSide === 'back') return 'Orqa tomoni';
  return null;
});

const selectedObject = computed(() => {
  void props.canvasVersion;
  return props.canvas?.getActiveObject() ?? null;
});

function selectLayer(item: LayerItem) {
  props.canvas?.setActiveObject(item.object);
  props.canvas?.requestRenderAll();
}

function toggleVisible(item: LayerItem) {
  item.object.set('visible', !item.object.visible);
  props.canvas?.requestRenderAll();
  props.canvas?.fire('object:modified', { target: item.object });
}

function deleteItem(item: LayerItem) {
  const c = props.canvas;
  if (!c) return;
  c.remove(item.object);
  if (c.getActiveObject() === item.object) c.discardActiveObject();
  c.requestRenderAll();
  c.fire('object:modified');
}

// ── Drag-and-drop reordering ────────────────────────────────────────────
// `items` is the canvas's z-order reversed (top layer first) for display,
// so re-inserting the dragged entry at its drop position and mapping back
// to canvas indices (bottom-up) keeps the visible list and actual stacking
// order in sync.
const draggedIndex = ref<number | null>(null);

function reorder(fromIndex: number, toIndex: number) {
  if (!props.canvas || fromIndex === toIndex) return;
  const display = [...items.value];
  const [moved] = display.splice(fromIndex, 1);
  if (!moved) return;
  display.splice(toIndex, 0, moved);
  const total = display.length;
  display.forEach((item, i) => props.canvas!.moveTo(item.object, total - 1 - i));
  props.canvas!.requestRenderAll();
  props.canvas!.fire('object:modified');
}

function handleDrop(index: number) {
  if (draggedIndex.value === null) return;
  reorder(draggedIndex.value, index);
  draggedIndex.value = null;
}
</script>

<template>
  <div
    id="garment-layers-panel"
    class="flex flex-col border-t border-brand-border/50 p-4"
  >
    <div class="mb-3 flex items-center justify-between">
      <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon
          name="lucide:layers"
          class="h-4 w-4"
        /> Qatlamlar
        <span
          v-if="sideHeading"
          class="rounded-full bg-brand-surface-low px-2 py-0.5 text-[11px] font-medium text-brand-muted"
        >{{ sideHeading }}</span>
      </p>
      <span class="text-xs text-brand-muted">{{ items.length }}</span>
    </div>

    <div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
      <p
        v-if="!items.length"
        class="text-xs text-brand-muted"
      >
        Hali qatlam qo'shilmagan.
      </p>
      <div
        v-for="(item, index) in items"
        :key="item.id"
        draggable="true"
        class="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors duration-150"
        :class="[
          selectedObject === item.object ? 'border-secondary-300 bg-secondary-50' : 'border-brand-border/50 bg-white',
          draggedIndex === index ? 'opacity-40' : '',
        ]"
        @dragstart="draggedIndex = index"
        @dragend="draggedIndex = null"
        @dragover.prevent
        @drop.prevent="handleDrop(index)"
      >
        <Icon
          name="lucide:grip-vertical"
          class="h-4 w-4 shrink-0 cursor-grab text-brand-muted/70"
        />
        <img
          v-if="item.thumbnail"
          :src="item.thumbnail"
          alt=""
          class="h-7 w-7 shrink-0 rounded-md border border-brand-border/50 object-cover"
        >
        <button
          type="button"
          class="min-w-0 flex-1 truncate text-left"
          @click="selectLayer(item)"
        >
          {{ item.label }}
        </button>
        <button
          type="button"
          :aria-label="item.visible ? 'Yashirish' : 'Ko\'rsatish'"
          @click="toggleVisible(item)"
        >
          <Icon
            :name="item.visible ? 'lucide:eye' : 'lucide:eye-off'"
            class="h-4 w-4 text-brand-muted"
          />
        </button>
        <button
          type="button"
          aria-label="Qatlamni o'chirish"
          class="text-rose-500 transition hover:text-rose-600"
          @click="deleteItem(item)"
        >
          <Icon
            name="lucide:trash-2"
            class="h-4 w-4"
          />
        </button>
      </div>
    </div>
  </div>
</template>
