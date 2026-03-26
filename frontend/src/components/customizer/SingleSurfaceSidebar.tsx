import React, { useCallback, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  AlertCircle,
  AlignCenter,
  CheckCircle,
  Image,
  Loader2,
  Maximize2,
  Smile,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import type { SingleSurfaceSidebarConfig } from './single-surface-presets';

interface SingleSurfaceSidebarProps {
  canvas: fabric.Canvas | null;
  config: SingleSurfaceSidebarConfig;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageState {
  thumbnail: string;
  name: string;
  sizeMb: string;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const TEXT_COLOR_PRESETS = [
  '#111827',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#ffffff',
] as const;

function addCanvasObject(canvas: fabric.Canvas, object: fabric.Object): void {
  canvas.add(object);
  canvas.setActiveObject(object);
  canvas.requestRenderAll();
}

function centerOnCanvas(
  canvas: fabric.Canvas,
  object: fabric.Object,
  extra: Partial<fabric.IObjectOptions> = {}
): void {
  object.set({
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    ...extra,
  });
  object.setCoords();
}

function fitActiveImage(canvas: fabric.Canvas, mode: 'contain' | 'fill'): void {
  const activeObject = canvas.getActiveObject() as fabric.Image | undefined;
  if (
    !activeObject ||
    activeObject.type !== 'image' ||
    !activeObject.width ||
    !activeObject.height
  ) {
    return;
  }

  const scale =
    mode === 'fill'
      ? Math.max(
          canvas.getWidth() / activeObject.width,
          canvas.getHeight() / activeObject.height
        )
      : Math.min(
          canvas.getWidth() / activeObject.width,
          canvas.getHeight() / activeObject.height
        );

  centerOnCanvas(canvas, activeObject, {
    scaleX: scale,
    scaleY: scale,
  });
  canvas.requestRenderAll();
}

export default function SingleSurfaceSidebar({
  canvas,
  config,
}: SingleSurfaceSidebarProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'stickers'>(
    'image'
  );
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [textColor, setTextColor] = useState('#2563eb');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback((): void => {
    setUploadStatus('idle');
    setErrorMessage('');
    setImageState(null);
  }, []);

  const applyTextColor = useCallback(
    (color: string): void => {
      setTextColor(color);

      if (!canvas) {
        return;
      }

      const activeObject = canvas.getActiveObject();
      if (!activeObject) {
        return;
      }

      if (['i-text', 'textbox', 'text'].includes(activeObject.type ?? '')) {
        activeObject.set('fill', color);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: activeObject });
      }
    },
    [canvas]
  );

  const loadImageToCanvas = useCallback(
    (file: File): void => {
      if (!canvas) {
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadStatus('error');
        setErrorMessage(
          `Noto'g'ri fayl turi: ${file.type || "noma'lum"}. PNG, JPG, WebP yoki GIF yuboring.`
        );
        return;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        setUploadStatus('error');
        setErrorMessage(
          `Fayl hajmi ${sizeMb.toFixed(1)} MB. Limit ${MAX_FILE_SIZE_MB} MB dan oshmasligi kerak.`
        );
        return;
      }

      setUploadStatus('loading');
      setErrorMessage('');

      const reader = new FileReader();
      reader.onload = event => {
        const dataUrl =
          typeof event.target?.result === 'string' ? event.target.result : '';
        if (!dataUrl) {
          setUploadStatus('error');
          setErrorMessage("Faylni o'qib bo'lmadi. Qayta urinib ko'ring.");
          return;
        }

        setImageState({
          thumbnail: dataUrl,
          name: file.name,
          sizeMb: sizeMb.toFixed(2),
        });

        fabric.Image.fromURL(
          dataUrl,
          image => {
            if (!image || !image.width || !image.height) {
              setUploadStatus('error');
              setErrorMessage("Rasm yuklanmadi. Boshqa faylni sinab ko'ring.");
              return;
            }

            const scale =
              Math.min(
                canvas.getWidth() / image.width,
                canvas.getHeight() / image.height
              ) * 0.8;

            centerOnCanvas(canvas, image, {
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              evented: true,
            });

            addCanvasObject(canvas, image);
            setUploadStatus('success');
          },
          { crossOrigin: 'anonymous' }
        );
      };

      reader.onerror = () => {
        setUploadStatus('error');
        setErrorMessage("Faylni o'qishda xatolik yuz berdi.");
      };

      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [canvas]
  );

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    if (file) {
      loadImageToCanvas(file);
    }
  };

  const handleAddText = (): void => {
    if (!canvas) {
      return;
    }

    const text = new fabric.IText(config.defaultText, {
      fontFamily: 'sans-serif',
      fontSize: config.defaultTextFontSize,
      fill: textColor,
      selectable: true,
      evented: true,
    });

    centerOnCanvas(canvas, text);
    addCanvasObject(canvas, text);
    text.enterEditing();
    text.selectAll();
    text.hiddenTextarea?.focus();
  };

  const handleAddSticker = (sticker: string): void => {
    if (!canvas) {
      return;
    }

    const text = new fabric.Text(sticker, {
      fontSize: config.stickerFontSize,
      selectable: true,
      evented: true,
    });

    centerOnCanvas(canvas, text);
    addCanvasObject(canvas, text);
  };

  const handleDeleteSelected = (): void => {
    if (!canvas) {
      return;
    }

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      return;
    }

    canvas.discardActiveObject();
    activeObjects.forEach(object => canvas.remove(object));
    canvas.requestRenderAll();
  };

  return (
    <div className='modern-sidebar'>
      <div className='sidebar-header'>
        <h2>{config.title}</h2>
        <p>{config.description}</p>
      </div>

      <div className='tab-menu'>
        <button
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <Image size={20} />
          <span>Rasm</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <Type size={20} />
          <span>Matn</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          <Smile size={20} />
          <span>Stiker</span>
        </button>
      </div>

      <div className='tab-content'>
        {activeTab === 'image' ? (
          <div className='panel'>
            <div
              className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${uploadStatus === 'error' ? 'upload-error-zone' : ''}`}
              onDragOver={event => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragOver(true);
              }}
              onDragLeave={event => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragOver(false);
              }}
              onDrop={event => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  loadImageToCanvas(file);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              role='button'
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileInputChange}
                hidden
              />

              {uploadStatus === 'loading' ? (
                <div className='upload-zone-inner'>
                  <Loader2 size={32} className='spin-icon' />
                  <p>Yuklanmoqda...</p>
                </div>
              ) : null}

              {uploadStatus === 'error' ? (
                <div className='upload-zone-inner'>
                  <AlertCircle size={32} color='#ef4444' />
                  <p className='upload-error-text'>{errorMessage}</p>
                  <span className='upload-retry'>Qayta urinish</span>
                </div>
              ) : null}

              {imageState && uploadStatus === 'success' ? (
                <div className='upload-zone-inner'>
                  <CheckCircle size={24} color='#22c55e' />
                  <p className='upload-success-text'>Yuklandi</p>
                  <p className='upload-filename'>{imageState.name}</p>
                </div>
              ) : null}

              {!imageState || uploadStatus === 'idle' ? (
                <div className='upload-zone-inner'>
                  <Upload size={32} />
                  <p>
                    <strong>Rasm tashlang</strong> yoki bosing
                  </p>
                  <span className='upload-hint'>
                    PNG, JPG, WebP - eng ko'pi {MAX_FILE_SIZE_MB} MB
                  </span>
                </div>
              ) : null}
            </div>

            {imageState ? (
              <div className='thumbnail-card'>
                <img
                  src={imageState.thumbnail}
                  alt='Yuklangan rasm'
                  className='thumbnail-img'
                />
                <div className='thumbnail-info'>
                  <p className='thumbnail-name'>{imageState.name}</p>
                  <p className='thumbnail-size'>{imageState.sizeMb} MB</p>
                </div>
                <button
                  className='thumbnail-remove'
                  onClick={resetUploadState}
                  title='Tozalash'
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div className='fit-controls'>
              <p className='fit-label'>Tanlangan rasmni moslashtirish:</p>
              <div className='fit-buttons'>
                <button
                  className='action-btn'
                  onClick={() => canvas && fitActiveImage(canvas, 'fill')}
                  title="To'liq to'ldirish"
                >
                  <Maximize2 size={16} /> To'ldirish
                </button>
                <button
                  className='action-btn'
                  onClick={() => canvas && fitActiveImage(canvas, 'contain')}
                  title='Markazlash'
                >
                  <AlignCenter size={16} /> Markazlash
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'text' ? (
          <div className='panel'>
            <button className='action-btn primary' onClick={handleAddText}>
              <Type size={16} /> Yangi matn qo'shish
            </button>
            <div className='mt-4'>
              <p className='hint-text'>Matn rangi</p>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <input
                  type='color'
                  value={textColor}
                  onChange={event => applyTextColor(event.target.value)}
                  className='h-10 w-10 cursor-pointer rounded-xl border border-slate-200 bg-white p-1'
                  aria-label='Matn rangini tanlash'
                />
                {TEXT_COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => applyTextColor(color)}
                    className='h-8 w-8 rounded-full border-2 transition-transform hover:scale-105'
                    style={{
                      backgroundColor: color,
                      borderColor:
                        textColor.toLowerCase() === color.toLowerCase()
                          ? '#0f172a'
                          : '#ffffff',
                    }}
                    aria-label={`Matn rangini ${color} ga o'zgartirish`}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'stickers' ? (
          <div className='panel'>
            <div className='sticker-grid'>
              {config.stickers.map(sticker => (
                <button
                  key={sticker}
                  className='sticker-btn'
                  onClick={() => handleAddSticker(sticker)}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className='global-actions'>
          <button className='action-btn danger' onClick={handleDeleteSelected}>
            <Trash2 size={16} /> Tanlanganni o'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
