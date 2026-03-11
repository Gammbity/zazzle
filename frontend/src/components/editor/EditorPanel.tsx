'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import type {
  Layer,
  TextLayer,
  ImageLayer,
  StickerLayer,
  StickerAsset,
  HistoryEntry,
  FontFamily,
} from '@/lib/editor/types';
import { FONT_FAMILIES } from '@/lib/editor/types';
import type { PrintableArea } from '@/lib/products/catalog';
import {
  uid,
  saveDraft,
  loadDraft,
  normaliseZIndexes,
  bringForward,
  sendBackward,
} from '@/lib/editor/serialize';
import type { DesignCanvasHandle } from './DesignCanvas';
import Modal from '@/components/Modal';
import StickerPicker from './StickerPicker';
import { cn } from '@/lib/utils';

/** Re-export handle type so parent can reference it. */
export type { DesignCanvasHandle };

/* Dynamically import DesignCanvas with SSR disabled (Konva needs DOM). */
const DesignCanvas = dynamic(() => import('./DesignCanvas'), { ssr: false });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 500; // px — square base; adjusted by canvasAspect
const MAX_HISTORY = 60;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditorPanelProps {
  productSlug: string;
  printableArea: PrintableArea;
  canvasAspect: number;
  /** Called with a data-URL whenever the user generates a preview. */
  onPreviewGenerated: (dataUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorPanel({
  productSlug,
  printableArea,
  canvasAspect,
  onPreviewGenerated,
}: EditorPanelProps) {
  // --- Canvas dimensions (responsive) ---
  const canvasWidth = CANVAS_SIZE;
  const canvasHeight = Math.round(CANVAS_SIZE / canvasAspect);

  // --- Layer state ---
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- History (undo / redo) ---
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryRef = useRef(false);

  // --- UI toggles ---
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // --- Canvas handle for export (set via onReady callback, not ref) ---
  const canvasHandleRef = useRef<DesignCanvasHandle | null>(null);

  // --- File input ref ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================================================
  // History helpers
  // ========================================================================

  const pushHistory = useCallback(
    (newLayers: Layer[]) => {
      if (skipHistoryRef.current) {
        skipHistoryRef.current = false;
        return;
      }
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const next = [...trimmed, { layers: newLayers }];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    skipHistoryRef.current = true;
    setLayers(history[newIdx].layers);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    skipHistoryRef.current = true;
    setLayers(history[newIdx].layers);
  }, [history, historyIndex]);

  // ========================================================================
  // Persist & restore
  // ========================================================================

  /* Restore from localStorage on mount */
  useEffect(() => {
    const draft = loadDraft(productSlug);
    if (draft) {
      setLayers(draft.layers);
      pushHistory(draft.layers);
    } else {
      pushHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  /* Auto-save on layer change (debounced) */
  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft({
        productSlug,
        selectedAngle: 'front',
        layers,
        canvasWidth,
        canvasHeight,
        updatedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(t);
  }, [layers, productSlug, canvasWidth, canvasHeight]);

  // ========================================================================
  // Layer mutations
  // ========================================================================

  const updateLayers = useCallback(
    (fn: (prev: Layer[]) => Layer[]) => {
      setLayers((prev) => {
        const next = fn(prev);
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const addLayer = useCallback(
    (layer: Layer) => {
      updateLayers((prev) => normaliseZIndexes([...prev, layer]));
      setSelectedId(layer.id);
    },
    [updateLayers],
  );

  const deleteLayer = useCallback(
    (id: string) => {
      updateLayers((prev) => normaliseZIndexes(prev.filter((l) => l.id !== id)));
      if (selectedId === id) setSelectedId(null);
    },
    [updateLayers, selectedId],
  );

  const handleTransform = useCallback(
    (id: string, attrs: Record<string, unknown>) => {
      updateLayers((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...attrs } as Layer) : l)),
      );
    },
    [updateLayers],
  );

  // ========================================================================
  // Add actions
  // ========================================================================

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const size = Math.min(canvasWidth * 0.6, canvasHeight * 0.6);
        const w = aspect >= 1 ? size : size * aspect;
        const h = aspect >= 1 ? size / aspect : size;
        const layer: ImageLayer = {
          id: uid(),
          type: 'image',
          name: file.name.slice(0, 20),
          src: url,
          x: (canvasWidth - w) / 2,
          y: (canvasHeight - h) / 2,
          width: w,
          height: h,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          zIndex: layers.length,
          visible: true,
        };
        addLayer(layer);
      };
      img.src = url;
      // Reset input so re-selecting the same file triggers onChange
      e.target.value = '';
    },
    [addLayer, canvasWidth, canvasHeight, layers.length],
  );

  const addText = useCallback(() => {
    const layer: TextLayer = {
      id: uid(),
      type: 'text',
      name: 'Text',
      text: 'Your text',
      fontFamily: 'Inter',
      fontSize: 32,
      fontStyle: '',
      fill: '#000000',
      align: 'center',
      x: canvasWidth * 0.2,
      y: canvasHeight * 0.4,
      width: canvasWidth * 0.6,
      height: 50,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      zIndex: layers.length,
      visible: true,
    };
    addLayer(layer);
    setEditingTextId(layer.id);
  }, [addLayer, canvasWidth, canvasHeight, layers.length]);

  const addSticker = useCallback(
    (sticker: StickerAsset) => {
      const size = Math.min(canvasWidth, canvasHeight) * 0.2;
      const layer: StickerLayer = {
        id: uid(),
        type: 'sticker',
        name: sticker.label,
        stickerId: sticker.id,
        src: sticker.src,
        x: (canvasWidth - size) / 2,
        y: (canvasHeight - size) / 2,
        width: size,
        height: size,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        zIndex: layers.length,
        visible: true,
      };
      addLayer(layer);
    },
    [addLayer, canvasWidth, canvasHeight, layers.length],
  );

  const resetDesign = useCallback(() => {
    // Revoke object URLs for image layers
    layers.forEach((l) => {
      if (l.type === 'image') URL.revokeObjectURL((l as ImageLayer).src);
    });
    updateLayers(() => []);
    setSelectedId(null);
  }, [layers, updateLayers]);

  // ========================================================================
  // Export
  // ========================================================================

  const generatePreview = useCallback(() => {
    const dataUrl = canvasHandleRef.current?.exportPng();
    if (dataUrl) onPreviewGenerated(dataUrl);
  }, [onPreviewGenerated]);

  // ========================================================================
  // Real-time preview generation (debounced)
  // ========================================================================

  useEffect(() => {
    // Skip if no layers
    if (layers.length === 0) {
      onPreviewGenerated('');
      return;
    }

    // Debounce preview generation to avoid excessive calls
    const timer = setTimeout(() => {
      generatePreview();
    }, 150); // 150ms debounce for smooth real-time updates

    return () => clearTimeout(timer);
  }, [layers, generatePreview, onPreviewGenerated]);

  // ========================================================================
  // Keyboard shortcuts
  // ========================================================================

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Delete / Backspace — remove selected layer
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingTextId) {
        e.preventDefault();
        deleteLayer(selectedId);
      }
      // Ctrl+Z — undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z — redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Escape — deselect
      if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingTextId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, editingTextId, deleteLayer, undo, redo]);

  // ========================================================================
  // Selected layer helpers
  // ========================================================================

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId) ?? null,
    [layers, selectedId],
  );

  const isTextSelected = selectedLayer?.type === 'text';
  const textLayer = isTextSelected ? (selectedLayer as TextLayer) : null;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="flex flex-col gap-4">
      {/* ───── Toolbar ───── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2">
        {/* Upload image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
        <ToolBtn
          label="Image"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          }
          onClick={() => fileInputRef.current?.click()}
        />

        {/* Add text */}
        <ToolBtn
          label="Text"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          }
          onClick={addText}
        />

        {/* Stickers */}
        <ToolBtn
          label="Sticker"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          onClick={() => setShowStickerPicker(true)}
        />

        <div className="mx-1 h-6 w-px bg-gray-200" />

        {/* Undo / Redo */}
        <ToolBtn label="Undo" onClick={undo} disabled={historyIndex <= 0}
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" /></svg>}
        />
        <ToolBtn label="Redo" onClick={redo} disabled={historyIndex >= history.length - 1}
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" /></svg>}
        />

        <div className="mx-1 h-6 w-px bg-gray-200" />

        {/* Z-index controls (only when a layer is selected) */}
        {selectedId && (
          <>
            <ToolBtn label="Forward"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>}
              onClick={() => updateLayers((prev) => bringForward(prev, selectedId))}
            />
            <ToolBtn label="Backward"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
              onClick={() => updateLayers((prev) => sendBackward(prev, selectedId))}
            />
            <ToolBtn label="Delete"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
              onClick={() => deleteLayer(selectedId)}
              danger
            />
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset */}
        <ToolBtn label="Reset" onClick={resetDesign}
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          danger
        />
      </div>

      {/* ───── Text editing panel (visible when a text layer is selected) ───── */}
      {isTextSelected && textLayer && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
          {/* Text content */}
          <input
            type="text"
            value={textLayer.text}
            onChange={(e) =>
              handleTransform(textLayer.id, { text: e.target.value } as Partial<TextLayer>)
            }
            className="w-40 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            placeholder="Enter text"
          />

          {/* Font family */}
          <select
            value={textLayer.fontFamily}
            onChange={(e) =>
              handleTransform(textLayer.id, {
                fontFamily: e.target.value as FontFamily,
              } as Partial<TextLayer>)
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Font size */}
          <input
            type="number"
            min={8}
            max={200}
            value={textLayer.fontSize}
            onChange={(e) =>
              handleTransform(textLayer.id, {
                fontSize: Number(e.target.value),
              } as Partial<TextLayer>)
            }
            className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
          />

          {/* Color */}
          <input
            type="color"
            value={textLayer.fill}
            onChange={(e) =>
              handleTransform(textLayer.id, { fill: e.target.value } as Partial<TextLayer>)
            }
            className="h-8 w-8 cursor-pointer rounded border border-gray-200"
          />

          {/* Bold */}
          <button
            onClick={() => {
              const isBold = textLayer.fontStyle.includes('bold');
              const newStyle = isBold
                ? textLayer.fontStyle.replace('bold', '').trim()
                : `bold ${textLayer.fontStyle}`.trim();
              handleTransform(textLayer.id, {
                fontStyle: newStyle as TextLayer['fontStyle'],
              } as Partial<TextLayer>);
            }}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-sm font-bold transition-colors',
              textLayer.fontStyle.includes('bold')
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100',
            )}
            aria-label="Toggle bold"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={() => {
              const isItalic = textLayer.fontStyle.includes('italic');
              const newStyle = isItalic
                ? textLayer.fontStyle.replace('italic', '').trim()
                : `${textLayer.fontStyle} italic`.trim();
              handleTransform(textLayer.id, {
                fontStyle: newStyle as TextLayer['fontStyle'],
              } as Partial<TextLayer>);
            }}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-sm italic transition-colors',
              textLayer.fontStyle.includes('italic')
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100',
            )}
            aria-label="Toggle italic"
          >
            I
          </button>
        </div>
      )}

      {/* ───── Canvas ───── */}
      <div className="flex justify-center overflow-auto">
        <DesignCanvas
          layers={layers}
          selectedLayerId={selectedId}
          printableArea={printableArea}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onSelectLayer={setSelectedId}
          onTransformLayer={handleTransform}
          onDoubleClickText={setEditingTextId}
          onReady={(handle) => { canvasHandleRef.current = handle; }}
        />
      </div>

      {/* ───── Layer list ───── */}
      {layers.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Layers ({layers.length})
          </p>
          <ul className="flex flex-col gap-1">
            {[...layers]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((l) => (
                <li
                  key={l.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors',
                    l.id === selectedId
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                  onClick={() => setSelectedId(l.id)}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-[10px] uppercase text-gray-400">
                      {l.type}
                    </span>
                    {l.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(l.id);
                    }}
                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label={`Delete ${l.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* ───── Sticker picker modal ───── */}
      <Modal
        open={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        title="Choose a sticker"
        maxWidth="max-w-lg"
      >
        <StickerPicker
          onSelect={addSticker}
          onClose={() => setShowStickerPicker(false)}
        />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small toolbar button
// ---------------------------------------------------------------------------

function ToolBtn({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : danger
            ? 'text-red-500 hover:bg-red-50'
            : 'text-gray-600 hover:bg-white hover:text-primary-600 hover:shadow-sm',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
