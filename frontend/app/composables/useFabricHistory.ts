import type { fabric } from 'fabric';

const MAX_HISTORY = 50;

// Undo/redo + localStorage draft persistence for a Fabric.js canvas. Ported
// 1:1 from the previous frontend's `useFabricHistory` React hook — same
// history-stack shape, same draft-key autosave — so refreshing mid-edit (or
// closing the Preview modal) never loses the design.
export function useFabricHistory(canvas: Ref<fabric.Canvas | null>, draftKey: Ref<string>) {
  const canvasVersion = ref(0);
  const historyIndex = ref(-1);
  const historyLength = ref(0);
  const hasSelection = ref(false);

  const historyStack = shallowRef<string[]>([]);
  const applyingHistory = ref(false);

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < historyLength.value - 1);

  function syncCanvasState() {
    canvasVersion.value++;
    hasSelection.value = Boolean(canvas.value?.getActiveObject());
  }

  function commitHistory() {
    const c = canvas.value;
    if (!c || applyingHistory.value) return;

    const snapshot = JSON.stringify(c.toJSON(['customType']));
    if (snapshot === historyStack.value[historyIndex.value]) {
      syncCanvasState();
      return;
    }

    const next = historyStack.value.slice(0, historyIndex.value + 1);
    next.push(snapshot);
    if (next.length > MAX_HISTORY) next.shift();

    historyStack.value = next;
    historyIndex.value = next.length - 1;
    historyLength.value = next.length;
    syncCanvasState();

    try {
      window.localStorage.setItem(draftKey.value, snapshot);
    }
    catch {
      // Editing still works when browser storage is unavailable.
    }
  }

  function restoreHistory(nextIndex: number) {
    const c = canvas.value;
    if (!c || nextIndex < 0 || nextIndex >= historyStack.value.length) return;

    applyingHistory.value = true;
    void c.loadFromJSON(historyStack.value[nextIndex], () => {
      c.requestRenderAll();
      c.fire('object:modified');
      applyingHistory.value = false;
      historyIndex.value = nextIndex;
      syncCanvasState();
    });
  }

  function attach(c: fabric.Canvas) {
    applyingHistory.value = true;
    c.clear();
    c.discardActiveObject();

    let savedDraft: string | null = null;
    try {
      savedDraft = window.localStorage.getItem(draftKey.value);
    }
    catch {
      // Browser storage unavailable — edit without a persisted draft.
    }

    const seedHistory = () => {
      const snapshot = JSON.stringify(c.toJSON(['customType']));
      historyStack.value = [snapshot];
      historyIndex.value = 0;
      historyLength.value = 1;
      applyingHistory.value = false;
      syncCanvasState();
      c.fire('object:modified');
    };

    if (savedDraft) {
      void c.loadFromJSON(savedDraft, () => {
        c.requestRenderAll();
        seedHistory();
      });
    }
    else {
      c.requestRenderAll();
      seedHistory();
    }

    c.on('object:added', commitHistory);
    c.on('object:modified', commitHistory);
    c.on('object:removed', commitHistory);
    c.on('selection:created', syncCanvasState);
    c.on('selection:updated', syncCanvasState);
    c.on('selection:cleared', syncCanvasState);
  }

  function detach(c: fabric.Canvas) {
    c.off('object:added', commitHistory);
    c.off('object:modified', commitHistory);
    c.off('object:removed', commitHistory);
    c.off('selection:created', syncCanvasState);
    c.off('selection:updated', syncCanvasState);
    c.off('selection:cleared', syncCanvasState);
  }

  function mutateSelected(action: 'forward' | 'backward' | 'duplicate') {
    const c = canvas.value;
    if (!c) return;
    const selected = c.getActiveObject();
    if (!selected) return;

    if (action === 'forward') {
      c.bringForward(selected);
      c.requestRenderAll();
      c.fire('object:modified', { target: selected });
      return;
    }
    if (action === 'backward') {
      c.sendBackwards(selected);
      c.requestRenderAll();
      c.fire('object:modified', { target: selected });
      return;
    }

    selected.clone((clone: fabric.Object) => {
      clone.set({ left: (selected.left ?? 0) + 16, top: (selected.top ?? 0) + 16 });
      c.add(clone);
      c.setActiveObject(clone);
      c.requestRenderAll();
    });
  }

  function clearDesign() {
    const c = canvas.value;
    if (!c) return;
    if (!window.confirm('Dizaynni to\'liq tozalaysizmi?')) return;

    c.clear();
    c.discardActiveObject();
    c.requestRenderAll();
    try {
      window.localStorage.removeItem(draftKey.value);
    }
    catch {
      // Ignore unavailable browser storage.
    }
  }

  return {
    canvasVersion,
    canUndo,
    canRedo,
    hasSelection,
    attach,
    detach,
    undo: () => restoreHistory(historyIndex.value - 1),
    redo: () => restoreHistory(historyIndex.value + 1),
    duplicateSelected: () => mutateSelected('duplicate'),
    bringForward: () => mutateSelected('forward'),
    sendBackward: () => mutateSelected('backward'),
    clearDesign,
  };
}
