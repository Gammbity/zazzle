'use client';

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  ImagePlus,
  Layers3,
  Redo2,
  RotateCcw,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import {
  useEditorStore,
  useActiveLayers,
  useSelectedLayer,
  useHistoryFlags,
} from '@/store/editorStore';
import { getProductConfig } from '@/lib/products/surfaces';
import {
  fitLayerScale,
  getDefaultLayerPosition,
} from '@/lib/products/printAreas';
import { STICKER_ASSETS } from '@/types/layer';
import type { ImageLayer, Layer, StickerLayer, TextLayer } from '@/types/layer';
import type { DesignCanvasHandle } from './DesignCanvas';
import LayerList from './LayerList';
import TextControls from '@/components/controls/TextControls';
import Modal from '@/components/Modal';
import StickerPicker from './StickerPicker';
import { cn } from '@/lib/utils';

export type { DesignCanvasHandle };

const DesignCanvas = lazy(() => import('./DesignCanvas'));
const DEFAULT_TEXT_COLORS = [
  '#2563eb',
  '#f97316',
  '#db2777',
  '#16a34a',
  '#7c3aed',
  '#0891b2',
] as const;

function CanvasSkeleton() {
  return (
    <div className='h-[420px] w-full max-w-[500px] animate-pulse rounded-[1.5rem] bg-slate-100' />
  );
}

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
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        danger
          ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
      )}
    >
      {icon}
      <span className='hidden sm:inline'>{label}</span>
    </button>
  );
}

const CANVAS_BASE = 500;

interface EditorPanelProps {
  productSlug: string;
  onPreviewGenerated: (dataUrl: string) => void;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export default function EditorPanel({
  productSlug,
  onPreviewGenerated,
}: EditorPanelProps) {
  const {
    activeSurfaceId,
    selectedLayerId,
    isDraftLoaded,
    addLayer,
    updateLayer,
    updateLayerCommit,
    deleteLayer,
    duplicateLayer,
    selectLayer,
    bringLayerForward,
    sendLayerBackward,
    setActiveSurface,
    hydrateDraft,
    persistDraft,
    persistDraftSync,
    resetDraft,
    undo,
    redo,
  } = useEditorStore();

  const layers = useActiveLayers();
  const selectedLayer = useSelectedLayer();
  const { canUndo, canRedo } = useHistoryFlags();
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const productConfig = useMemo(
    () => getProductConfig(productSlug),
    [productSlug]
  );
  const activeSurface = useMemo(
    () =>
      productConfig?.surfaces.find(surface => surface.id === activeSurfaceId),
    [activeSurfaceId, productConfig]
  );

  const canvasWidth = productSlug === 'pen' ? 640 : CANVAS_BASE;
  const canvasHeight = activeSurface
    ? Math.round(CANVAS_BASE / activeSurface.canvasAspect)
    : CANVAS_BASE;
  const printArea = activeSurface?.printArea ?? {
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  };
  const hasSurfaces = (productConfig?.surfaces.length ?? 0) > 1;
  const isTextSelected = selectedLayer?.type === 'text';
  const layerPlacementScale = Math.min(printArea.defaultScale ?? 0.8, 1);
  const textPlacementScale = Math.min(layerPlacementScale + 0.05, 0.95);
  const stickerPlacementScale = Math.max(0.18, layerPlacementScale * 0.24);
  const shouldCropPreview = !['mug', 'pen'].includes(productSlug);

  useEffect(() => {
    void hydrateDraft(productSlug);
  }, [hydrateDraft, productSlug]);

  useEffect(() => {
    if (!isDraftLoaded) {
      return;
    }

    persistDraftSync();
  }, [activeSurfaceId, isDraftLoaded, layers, persistDraftSync]);

  useEffect(() => {
    if (!isDraftLoaded) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void persistDraft();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [activeSurfaceId, isDraftLoaded, layers, persistDraft]);

  const canvasHandleRef = useRef<DesignCanvasHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (layers.length === 0) {
      onPreviewGenerated('');
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const url = canvasHandleRef.current?.exportPng({
        cropToPrintArea: shouldCropPreview,
      });

      if (url) {
        onPreviewGenerated(url);
      }
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [layers, onPreviewGenerated, shouldCropPreview]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isTyping = isEditableTarget(event.target);
      const key = event.key.toLowerCase();

      if (event.key === 'Escape') {
        selectLayer(null);
        return;
      }

      if (isTyping) {
        return;
      }

      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedLayerId
      ) {
        event.preventDefault();
        deleteLayer(selectedLayerId);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        ((key === 'z' && event.shiftKey) || key === 'y')
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteLayer, redo, selectLayer, selectedLayerId, undo]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const image = new window.Image();
        image.onload = () => {
          const scale = fitLayerScale(
            printArea,
            canvasWidth,
            canvasHeight,
            image.width,
            image.height,
            layerPlacementScale
          );
          const width = image.width * scale;
          const height = image.height * scale;
          const position = getDefaultLayerPosition(
            printArea,
            canvasWidth,
            canvasHeight,
            width,
            height
          );

          addLayer({
            type: 'image',
            name: file.name.slice(0, 20),
            src: dataUrl,
            x: position.x,
            y: position.y,
            width: image.width,
            height: image.height,
            scaleX: scale,
            scaleY: scale,
            rotation: 0,
            opacity: 1,
            visible: true,
          } as Omit<ImageLayer, 'id' | 'zIndex'>);
        };
        image.src = dataUrl;
      } finally {
        event.target.value = '';
      }
    },
    [addLayer, canvasHeight, canvasWidth, layerPlacementScale, printArea]
  );

  const handleAddText = useCallback(() => {
    const width = (printArea.width / 100) * canvasWidth * textPlacementScale;
    const nextTextColor =
      DEFAULT_TEXT_COLORS[
        layers.filter(layer => layer.type === 'text').length %
          DEFAULT_TEXT_COLORS.length
      ];
    const position = getDefaultLayerPosition(
      printArea,
      canvasWidth,
      canvasHeight,
      width,
      50
    );

    addLayer({
      type: 'text',
      name: 'Matn',
      text: 'Matningiz',
      fontFamily: 'Inter',
      fontSize: 32,
      fontStyle: '',
      fill: nextTextColor,
      align: 'center',
      x: position.x,
      y: position.y,
      width,
      height: 50,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
    } as Omit<TextLayer, 'id' | 'zIndex'>);
  }, [
    addLayer,
    canvasHeight,
    canvasWidth,
    layers,
    printArea,
    textPlacementScale,
  ]);

  const handleAddSticker = useCallback(
    (sticker: (typeof STICKER_ASSETS)[number]) => {
      const size =
        Math.min(
          (printArea.width / 100) * canvasWidth,
          (printArea.height / 100) * canvasHeight
        ) * stickerPlacementScale;
      const position = getDefaultLayerPosition(
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
        x: position.x,
        y: position.y,
        width: size,
        height: size,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
      } as Omit<StickerLayer, 'id' | 'zIndex'>);
    },
    [addLayer, canvasHeight, canvasWidth, printArea, stickerPlacementScale]
  );

  const handleUpdateText = useCallback(
    (attributes: Partial<TextLayer>) => {
      if (selectedLayerId) {
        updateLayer(selectedLayerId, attributes as Partial<Layer>);
      }
    },
    [selectedLayerId, updateLayer]
  );

  const handleResetDraft = useCallback(() => {
    if (
      layers.length > 0 &&
      !window.confirm(
        "Barcha qatlamlar o'chiriladi. Dizaynni tozalashni davom ettirasizmi?"
      )
    ) {
      return;
    }

    resetDraft();
  }, [layers.length, resetDraft]);

  return (
    <div className='flex flex-col gap-4'>
      {hasSurfaces && productConfig && (
        <div className='flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2'>
          {productConfig.surfaces.map(surface => (
            <button
              key={surface.id}
              type='button'
              onClick={() => setActiveSurface(surface.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                activeSurfaceId === surface.id
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {surface.label}
            </button>
          ))}
        </div>
      )}

      <div className='flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          onChange={handleImageUpload}
          className='hidden'
        />

        <ToolBtn
          label='Rasm'
          onClick={() => fileInputRef.current?.click()}
          icon={<ImagePlus className='h-4 w-4' />}
        />
        <ToolBtn
          label='Matn'
          onClick={handleAddText}
          icon={<Type className='h-4 w-4' />}
        />
        <ToolBtn
          label='Stiker'
          onClick={() => setShowStickerPicker(true)}
          icon={<Sticker className='h-4 w-4' />}
        />

        <div className='mx-1 hidden h-6 w-px bg-slate-200 sm:block' />

        <ToolBtn
          label='Ortga'
          onClick={undo}
          disabled={!canUndo}
          icon={<Undo2 className='h-4 w-4' />}
        />
        <ToolBtn
          label='Qaytarish'
          onClick={redo}
          disabled={!canRedo}
          icon={<Redo2 className='h-4 w-4' />}
        />

        {selectedLayerId && (
          <>
            <div className='mx-1 hidden h-6 w-px bg-slate-200 sm:block' />
            <ToolBtn
              label='Oldinga'
              onClick={() => bringLayerForward(selectedLayerId)}
              icon={<ArrowUpToLine className='h-4 w-4' />}
            />
            <ToolBtn
              label='Orqaga'
              onClick={() => sendLayerBackward(selectedLayerId)}
              icon={<ArrowDownToLine className='h-4 w-4' />}
            />
            <ToolBtn
              label='Nusxa'
              onClick={() => duplicateLayer(selectedLayerId)}
              icon={<Copy className='h-4 w-4' />}
            />
            <ToolBtn
              label="O'chirish"
              onClick={() => deleteLayer(selectedLayerId)}
              danger
              icon={<Trash2 className='h-4 w-4' />}
            />
          </>
        )}

        <div className='flex-1' />
        <ToolBtn
          label='Tozalash'
          onClick={handleResetDraft}
          danger
          icon={<RotateCcw className='h-4 w-4' />}
        />
      </div>

      {isTextSelected && selectedLayer && (
        <TextControls
          layer={selectedLayer as import('@/types/layer').TextLayer}
          onUpdate={handleUpdateText}
        />
      )}

      {layers.length === 0 && (
        <div className='rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-6 text-center'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700'>
            <Sparkles className='h-6 w-6' />
          </div>
          <h3 className='mt-4 text-xl font-semibold text-slate-900'>
            Bo'sh maket tayyor
          </h3>
          <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600'>
            Boshlash uchun rasm yuklang, matn yozing yoki stiker tanlang.
            Elementlar avtomatik ravishda xavfsiz chop hududi ichiga
            joylashtiriladi.
          </p>
          <div className='mt-5 flex flex-wrap justify-center gap-3'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
            >
              Rasm yuklash
            </button>
            <button
              type='button'
              onClick={handleAddText}
              className='rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50'
            >
              Matn qo'shish
            </button>
            <button
              type='button'
              onClick={() => setShowStickerPicker(true)}
              className='rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50'
            >
              Stiker tanlash
            </button>
          </div>
        </div>
      )}

      <div className='rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60'>
        <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-semibold text-slate-900'>
              Maket maydoni
            </p>
            <p className='mt-1 text-sm text-slate-500'>
              Tanlangan yuzasi: {activeSurface?.label ?? 'Asosiy'}.
            </p>
          </div>

          <div className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600'>
            <Layers3 className='h-4 w-4 text-sky-700' />
            {layers.length} ta qatlam
          </div>
        </div>

        <div className='flex justify-center overflow-auto'>
          <Suspense fallback={<CanvasSkeleton />}>
            <DesignCanvas
              layers={layers}
              selectedLayerId={selectedLayerId}
              printArea={printArea}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onSelectLayer={selectLayer}
              onChangeLayer={(id, attributes) =>
                updateLayer(id, attributes as Partial<Layer>)
              }
              onCommitLayer={(id, attributes) =>
                updateLayerCommit(id, attributes as Partial<Layer>)
              }
              onReady={handle => {
                canvasHandleRef.current = handle;
              }}
            />
          </Suspense>
        </div>
      </div>

      <LayerList
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelect={selectLayer}
        onDelete={deleteLayer}
      />

      <Modal
        open={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        title='Stiker tanlang'
        maxWidth='max-w-3xl'
      >
        <StickerPicker
          onSelect={handleAddSticker}
          onClose={() => setShowStickerPicker(false)}
        />
      </Modal>
    </div>
  );
}
