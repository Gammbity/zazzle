import { useCallback, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eye,
  EyeOff,
  Layers3,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';

interface FabricEditorControlsProps {
  canvas: fabric.Canvas | null;
  draftKey: string;
}

interface FabricLayersPanelProps {
  canvas: fabric.Canvas | null;
}

const MAX_HISTORY = 50;

export function useFabricHistory(canvas: fabric.Canvas | null, draftKey: string) {
  const [, setCanvasVersion] = useState(0);
  const [historyState, setHistoryState] = useState({ index: -1, length: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const applyingHistoryRef = useRef(false);

  const syncCanvasState = useCallback(() => {
    setCanvasVersion(version => version + 1);
    setHasSelection(!!canvas?.getActiveObject());
  }, [canvas]);

  const commitHistory = useCallback(() => {
    if (!canvas || applyingHistoryRef.current) return;

    const snapshot = JSON.stringify(canvas.toJSON());
    if (snapshot === historyRef.current[historyIndexRef.current]) {
      syncCanvasState();
      return;
    }

    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push(snapshot);
    if (next.length > MAX_HISTORY) next.shift();

    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
    setHistoryState({ index: historyIndexRef.current, length: next.length });
    syncCanvasState();

    try {
      window.localStorage.setItem(draftKey, snapshot);
    } catch {
      // Editing still works when browser storage is unavailable.
    }
  }, [canvas, draftKey, syncCanvasState]);

  const restoreHistory = useCallback(
    (nextIndex: number) => {
      if (!canvas || nextIndex < 0 || nextIndex >= historyRef.current.length) {
        return;
      }

      applyingHistoryRef.current = true;
      void canvas.loadFromJSON(historyRef.current[nextIndex], () => {
        canvas.requestRenderAll();
        canvas.fire('object:modified');
        applyingHistoryRef.current = false;
        historyIndexRef.current = nextIndex;
        setHistoryState({
          index: nextIndex,
          length: historyRef.current.length,
        });
        syncCanvasState();
      });
    },
    [canvas, syncCanvasState]
  );

  useEffect(() => {
    if (!canvas) return;

    applyingHistoryRef.current = true;
    canvas.clear();
    canvas.discardActiveObject();

    let savedDraft: string | null = null;
    try {
      savedDraft = window.localStorage.getItem(draftKey);
    } catch {
      savedDraft = null;
    }

    const seedHistory = () => {
      const snapshot = JSON.stringify(canvas.toJSON());
      historyRef.current = [snapshot];
      historyIndexRef.current = 0;
      setHistoryState({ index: 0, length: 1 });
      applyingHistoryRef.current = false;
      syncCanvasState();
      canvas.fire('object:modified');
    };

    if (savedDraft) {
      void canvas.loadFromJSON(savedDraft, () => {
        canvas.requestRenderAll();
        seedHistory();
      });
    } else {
      canvas.requestRenderAll();
      seedHistory();
    }

    canvas.on('object:added', commitHistory);
    canvas.on('object:modified', commitHistory);
    canvas.on('object:removed', commitHistory);
    canvas.on('selection:created', syncCanvasState);
    canvas.on('selection:updated', syncCanvasState);
    canvas.on('selection:cleared', syncCanvasState);

    return () => {
      canvas.off('object:added', commitHistory);
      canvas.off('object:modified', commitHistory);
      canvas.off('object:removed', commitHistory);
      canvas.off('selection:created', syncCanvasState);
      canvas.off('selection:updated', syncCanvasState);
      canvas.off('selection:cleared', syncCanvasState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, draftKey]);

  const mutateSelected = useCallback(
    (action: 'forward' | 'backward' | 'duplicate') => {
      if (!canvas) return;
      const selected = canvas.getActiveObject();
      if (!selected) return;

      if (action === 'forward') {
        canvas.bringForward(selected);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: selected });
        return;
      }

      if (action === 'backward') {
        canvas.sendBackwards(selected);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: selected });
        return;
      }

      selected.clone((clone: fabric.Object) => {
        clone.set({
          left: (selected.left ?? 0) + 16,
          top: (selected.top ?? 0) + 16,
        });
        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
      });
    },
    [canvas]
  );

  const clearDesign = useCallback(() => {
    if (!canvas || !window.confirm("Dizaynni to'liq tozalaysizmi?")) return;

    canvas.clear();
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Ignore unavailable browser storage.
    }
  }, [canvas, draftKey]);

  return {
    canUndo: historyState.index > 0,
    canRedo: historyState.index < historyState.length - 1,
    hasSelection,
    undo: () => restoreHistory(historyState.index - 1),
    redo: () => restoreHistory(historyState.index + 1),
    duplicateSelected: () => mutateSelected('duplicate'),
    bringForward: () => mutateSelected('forward'),
    sendBackward: () => mutateSelected('backward'),
    clearDesign,
  };
}

export default function FabricEditorControls({
  canvas,
  draftKey,
}: FabricEditorControlsProps) {
  const {
    canUndo,
    canRedo,
    hasSelection,
    undo,
    redo,
    duplicateSelected,
    bringForward,
    sendBackward,
    clearDesign,
  } = useFabricHistory(canvas, draftKey);

  return (
    <div className='editor-actions-panel'>
      <div className='editor-actions-grid'>
        <button
          type='button'
          className='action-btn'
          disabled={!canUndo}
          onClick={undo}
          aria-label='Ortga'
          title='Ortga'
        >
          <Undo2 size={16} /> Ortga
        </button>
        <button
          type='button'
          className='action-btn'
          disabled={!canRedo}
          onClick={redo}
          aria-label='Qaytarish'
          title='Qaytarish'
        >
          <Redo2 size={16} /> Qaytarish
        </button>
        <button
          type='button'
          className='action-btn'
          disabled={!hasSelection}
          onClick={bringForward}
          aria-label='Oldinga'
          title='Oldinga'
        >
          <ArrowUpToLine size={16} /> Oldinga
        </button>
        <button
          type='button'
          className='action-btn'
          disabled={!hasSelection}
          onClick={sendBackward}
          aria-label='Orqaga'
          title='Orqaga'
        >
          <ArrowDownToLine size={16} /> Orqaga
        </button>
        <button
          type='button'
          className='action-btn'
          disabled={!hasSelection}
          onClick={duplicateSelected}
          aria-label='Nusxa'
          title='Nusxa'
        >
          <Copy size={16} /> Nusxa
        </button>
        <button
          type='button'
          className='action-btn'
          onClick={clearDesign}
          aria-label='Tozalash'
          title='Tozalash'
        >
          <RotateCcw size={16} /> Tozalash
        </button>
      </div>
    </div>
  );
}

export function FabricLayersPanel({ canvas }: FabricLayersPanelProps) {
  const [, setCanvasVersion] = useState(0);

  const syncCanvasState = useCallback(() => {
    setCanvasVersion(version => version + 1);
  }, []);

  useEffect(() => {
    if (!canvas) return;

    canvas.on('object:added', syncCanvasState);
    canvas.on('object:modified', syncCanvasState);
    canvas.on('object:removed', syncCanvasState);
    canvas.on('selection:created', syncCanvasState);
    canvas.on('selection:updated', syncCanvasState);
    canvas.on('selection:cleared', syncCanvasState);

    return () => {
      canvas.off('object:added', syncCanvasState);
      canvas.off('object:modified', syncCanvasState);
      canvas.off('object:removed', syncCanvasState);
      canvas.off('selection:created', syncCanvasState);
      canvas.off('selection:updated', syncCanvasState);
      canvas.off('selection:cleared', syncCanvasState);
    };
  }, [canvas, syncCanvasState]);

  const layers = canvas ? [...canvas.getObjects()].reverse() : [];
  const selectedObject = canvas?.getActiveObject() ?? null;

  return (
    <div className='mt-5 border-t border-slate-200 pt-4'>
      <div className='mb-3 flex items-center justify-between'>
        <p className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
          <Layers3 size={16} /> Qatlamlar
        </p>
        <span className='text-xs text-slate-400'>{layers.length}</span>
      </div>
      <div className='flex max-h-44 flex-col gap-2 overflow-y-auto'>
        {layers.length === 0 ? (
          <p className='text-xs text-slate-400'>Hali qatlam qo‘shilmagan.</p>
        ) : (
          layers.map((layer, index) => {
            const label =
              layer.type === 'image'
                ? 'Rasm'
                : ['i-text', 'textbox', 'text'].includes(layer.type ?? '')
                  ? 'Matn'
                  : `Qatlam ${layers.length - index}`;

            return (
              <div
                key={`${layer.type}-${index}`}
                className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-sm ${
                  selectedObject === layer
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type='button'
                  className='min-w-0 flex-1 truncate text-left'
                  onClick={() => {
                    canvas?.setActiveObject(layer);
                    canvas?.requestRenderAll();
                    syncCanvasState();
                  }}
                >
                  {label}
                </button>
                <button
                  type='button'
                  aria-label={
                    layer.visible ? 'Qatlamni yashirish' : 'Qatlamni ko‘rsatish'
                  }
                  onClick={() => {
                    layer.set('visible', !layer.visible);
                    canvas?.requestRenderAll();
                    canvas?.fire('object:modified', { target: layer });
                  }}
                >
                  {layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
