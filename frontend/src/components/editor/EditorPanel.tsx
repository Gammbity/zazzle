'use client';

import { lazy, Suspense, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  useEditorStore,
  useActiveLayers,
  useSelectedLayer,
  useHistoryFlags,
} from '@/store/editorStore';
import { uid } from '@/lib/editor/serialize';
import { getProductConfig } from '@/lib/products/surfaces';
import {
  fitLayerScale,
  getDefaultLayerPosition,
} from '@/lib/products/printAreas';
import { STICKER_ASSETS } from '@/types/layer';
import type { ImageLayer, TextLayer, StickerLayer, Layer } from '@/types/layer';
import type { DesignCanvasHandle } from './DesignCanvas';
import LayerList from './LayerList';
import TextControls from '@/components/controls/TextControls';
import Modal from '@/components/Modal';
import StickerPicker from './StickerPicker';
import { cn } from '@/lib/utils';

/** Re-export for parent components */
export type { DesignCanvasHandle };

const DesignCanvas = lazy(() => import('./DesignCanvas'));

function CanvasSkeleton() {
  return (
    <div className='h-[420px] w-full max-w-[500px] animate-pulse rounded-xl bg-gray-100' />
  );
}

// ---------------------------------------------------------------------------
// Small reusable toolbar button
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
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors',
        danger
          ? 'border-red-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-40'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40'
      )}
    >
      {icon}
      <span className='hidden sm:inline'>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Canvas size constants
// ---------------------------------------------------------------------------

const CANVAS_BASE = 500;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditorPanelProps {
  productSlug: string;
  /** Called with a data-URL whenever the design changes (for live preview). */
  onPreviewGenerated: (dataUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorPanel({
  productSlug,
  onPreviewGenerated,
}: EditorPanelProps) {
  // ── Store ────────────────────────────────────────────────────────────────
  const {
    activeSurfaceId,
    surfaces,
    selectedLayerId,
    isDraftLoaded,
    addLayer,
    updateLayer,
    updateLayerCommit,
    deleteLayer,
    selectLayer,
    bringLayerForward,
    sendLayerBackward,
    setActiveSurface,
    hydrateDraft,
    persistDraft,
    resetDraft,
    undo,
    redo,
  } = useEditorStore();

  const layers = useActiveLayers();
  const selectedLayer = useSelectedLayer();
  const { canUndo, canRedo } = useHistoryFlags();

  // ── Product config ────────────────────────────────────────────────────────
  const productConfig = useMemo(
    () => getProductConfig(productSlug),
    [productSlug]
  );
  const activeSurface = useMemo(
    () => productConfig?.surfaces.find(s => s.id === activeSurfaceId),
    [productConfig, activeSurfaceId]
  );

  const canvasWidth = CANVAS_BASE;
  const canvasHeight = activeSurface
    ? Math.round(CANVAS_BASE / activeSurface.canvasAspect)
    : CANVAS_BASE;

  const printArea = activeSurface?.printArea ?? {
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  };

  // ── Hydrate draft on mount ────────────────────────────────────────────────
  useEffect(() => {
    hydrateDraft(productSlug);
  }, [productSlug, hydrateDraft]);

  // ── Debounced auto-save ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isDraftLoaded) return;
    const t = setTimeout(() => {
      persistDraft();
    }, 500);
    return () => clearTimeout(t);
  }, [layers, isDraftLoaded, persistDraft]);

  // ── Canvas handle for export ──────────────────────────────────────────────
  const canvasHandleRef = useRef<DesignCanvasHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStickerPicker, setShowStickerPicker] = [false, () => {}]; // placeholder – see below
  const [_showStickerPicker, _setShowStickerPicker] = [
    false,
    (_: boolean) => {},
  ];

  // ── Live preview generation ───────────────────────────────────────────────
  useEffect(() => {
    if (layers.length === 0) {
      onPreviewGenerated('');
      return;
    }
    const t = setTimeout(() => {
      const url = canvasHandleRef.current?.exportPng();
      if (url) onPreviewGenerated(url);
    }, 150);
    return () => clearTimeout(t);
  }, [layers, onPreviewGenerated]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        e.preventDefault();
        deleteLayer(selectedLayerId);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') selectLayer(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedLayerId, deleteLayer, undo, redo, selectLayer]);

  // ── Add image ─────────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const img = new window.Image();
        img.onload = () => {
          const scale = fitLayerScale(
            printArea,
            canvasWidth,
            canvasHeight,
            img.width,
            img.height
          );
          const w = img.width * scale;
          const h = img.height * scale;
          const pos = getDefaultLayerPosition(
            printArea,
            canvasWidth,
            canvasHeight,
            w,
            h
          );

          addLayer({
            type: 'image',
            name: file.name.slice(0, 20),
            src: dataUrl,
            x: pos.x,
            y: pos.y,
            width: img.width,
            height: img.height,
            scaleX: scale,
            scaleY: scale,
            rotation: 0,
            opacity: 1,
            visible: true,
          } as Omit<ImageLayer, 'id' | 'zIndex'>);
        };
        img.src = dataUrl;
      } finally {
        e.target.value = '';
      }
    },
    [printArea, canvasWidth, canvasHeight, addLayer]
  );

  // ── Add text ──────────────────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const w = (printArea.width / 100) * canvasWidth * 0.8;
    const pos = getDefaultLayerPosition(
      printArea,
      canvasWidth,
      canvasHeight,
      w,
      50
    );
    addLayer({
      type: 'text',
      name: 'Text',
      text: 'Your text',
      fontFamily: 'Inter',
      fontSize: 32,
      fontStyle: '',
      fill: '#000000',
      align: 'center',
      x: pos.x,
      y: pos.y,
      width: w,
      height: 50,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
    } as Omit<TextLayer, 'id' | 'zIndex'>);
  }, [printArea, canvasWidth, canvasHeight, addLayer]);

  // ── Add sticker ───────────────────────────────────────────────────────────
  const handleAddSticker = useCallback(
    (sticker: (typeof STICKER_ASSETS)[number]) => {
      const size =
        Math.min(
          (printArea.width / 100) * canvasWidth,
          (printArea.height / 100) * canvasHeight
        ) * 0.22;
      const pos = getDefaultLayerPosition(
        printArea,
        canvasWidth,
        canvasHeight,
        size,
        size
      );
      addLayer({
        type: 'sticker',
        name: sticker.label,
        stickerId: sticker.id,
        src: sticker.src,
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
      } as Omit<StickerLayer, 'id' | 'zIndex'>);
    },
    [printArea, canvasWidth, canvasHeight, addLayer]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleUpdateText = useCallback(
    (attrs: Partial<TextLayer>) => {
      if (selectedLayerId)
        updateLayer(selectedLayerId, attrs as Partial<Layer>);
    },
    [selectedLayerId, updateLayer]
  );

  const isTextSelected = selectedLayer?.type === 'text';

  // ── Surface tabs (if product has multiple) ────────────────────────────────
  const hasSurfaces = (productConfig?.surfaces.length ?? 0) > 1;

  return (
    <div className='flex flex-col gap-4'>
      {/* Surface tabs */}
      {hasSurfaces && productConfig && (
        <div className='flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1'>
          {productConfig.surfaces.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSurface(s.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeSurfaceId === s.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          onChange={handleImageUpload}
          className='hidden'
        />

        <ToolBtn
          label='Image'
          onClick={() => fileInputRef.current?.click()}
          icon={
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          }
        />
        <ToolBtn
          label='Text'
          onClick={handleAddText}
          icon={
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          }
        />

        <div className='mx-1 h-6 w-px bg-gray-200' />

        <ToolBtn
          label='Undo'
          onClick={undo}
          disabled={!canUndo}
          icon={
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4'
              />
            </svg>
          }
        />
        <ToolBtn
          label='Redo'
          onClick={redo}
          disabled={!canRedo}
          icon={
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4'
              />
            </svg>
          }
        />

        {selectedLayerId && (
          <>
            <div className='mx-1 h-6 w-px bg-gray-200' />
            <ToolBtn
              label='Forward'
              onClick={() => bringLayerForward(selectedLayerId)}
              icon={
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 15l7-7 7 7'
                  />
                </svg>
              }
            />
            <ToolBtn
              label='Backward'
              onClick={() => sendLayerBackward(selectedLayerId)}
              icon={
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              }
            />
            <ToolBtn
              label='Delete'
              onClick={() => deleteLayer(selectedLayerId)}
              danger
              icon={
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              }
            />
          </>
        )}

        <div className='flex-1' />
        <ToolBtn
          label='Reset'
          onClick={resetDraft}
          danger
          icon={
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          }
        />
      </div>

      {/* Text controls panel */}
      {isTextSelected && selectedLayer && (
        <TextControls
          layer={selectedLayer as import('@/types/layer').TextLayer}
          onUpdate={handleUpdateText}
        />
      )}

      {/* Canvas */}
      <div className='flex justify-center overflow-auto'>
        <Suspense fallback={<CanvasSkeleton />}>
          <DesignCanvas
            layers={layers}
            selectedLayerId={selectedLayerId}
            printArea={printArea}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onSelectLayer={selectLayer}
            onChangeLayer={(id, attrs) =>
              updateLayer(id, attrs as Partial<Layer>)
            }
            onCommitLayer={(id, attrs) =>
              updateLayerCommit(id, attrs as Partial<Layer>)
            }
            onReady={h => {
              canvasHandleRef.current = h;
            }}
          />
        </Suspense>
      </div>

      {/* Layer list */}
      <LayerList
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelect={selectLayer}
        onDelete={deleteLayer}
      />
    </div>
  );
}
