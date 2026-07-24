import React, { useCallback, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Smile,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { FabricLayersPanel } from './FabricEditorControls';
import {
  GARMENT_COLORS,
  GARMENT_DEFAULT_TEXT,
  GARMENT_DEFAULT_TEXT_FONT_SIZE,
  GARMENT_STICKER_FONT_SIZE,
  GARMENT_STICKERS,
} from './garment-presets';

export type GarmentTab = 'image' | 'text' | 'stickers' | 'product';

interface GarmentSidebarProps {
  canvas: fabric.Canvas | null;
  productLabel: string;
  shirtColor: string;
  onShirtColorChange: (hex: string) => void;
  activeTab: GarmentTab;
}

interface GarmentRailProps {
  activeTab: GarmentTab;
  onChange: (tab: GarmentTab) => void;
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

const RAIL_TABS: Array<{ id: GarmentTab; label: string; icon: React.ReactNode }> = [
  { id: 'image', label: 'Rasm', icon: <ImageIcon size={20} /> },
  { id: 'text', label: 'Matn', icon: <Type size={20} /> },
  { id: 'stickers', label: 'Emoji', icon: <Smile size={20} /> },
  { id: 'product', label: 'Mahsulot', icon: <Package size={20} /> },
];

export function GarmentRail({ activeTab, onChange }: GarmentRailProps) {
  return (
    <div className='garment-rail'>
      {RAIL_TABS.map(tab => (
        <button
          key={tab.id}
          type='button'
          className={`garment-rail-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function GarmentSidebar({
  canvas,
  productLabel,
  shirtColor,
  onShirtColorChange,
  activeTab,
}: GarmentSidebarProps) {
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
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
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
      if (!canvas) return;

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
    if (file) loadImageToCanvas(file);
  };

  const handleAddText = (): void => {
    if (!canvas) return;
    const text = new fabric.IText(GARMENT_DEFAULT_TEXT, {
      fontFamily: 'sans-serif',
      fontSize: GARMENT_DEFAULT_TEXT_FONT_SIZE,
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
    if (!canvas) return;
    const text = new fabric.Text(sticker, {
      fontSize: GARMENT_STICKER_FONT_SIZE,
      selectable: true,
      evented: true,
    });
    centerOnCanvas(canvas, text);
    addCanvasObject(canvas, text);
  };

  return (
    <div className='garment-sidebar'>
      <div className='garment-panel-scroll'>
        <div className='garment-panel-section'>
          <p className='garment-section-title'>Mahsulot rangi</p>
          <div className='garment-color-row'>
            {GARMENT_COLORS.map(color => (
              <button
                key={color.value}
                type='button'
                className='color-swatch'
                style={{ backgroundColor: color.value }}
                onClick={() => onShirtColorChange(color.value)}
                title={color.name}
                aria-label={color.name}
                aria-pressed={shirtColor === color.value}
              >
                {shirtColor === color.value ? (
                  <CheckCircle
                    size={14}
                    color={color.value === '#ffffff' ? '#8d4b00' : '#ffffff'}
                  />
                ) : null}
              </button>
            ))}
            <label className='garment-color-add' title="Boshqa rang tanlash">
              <Plus size={14} />
              <input
                type='color'
                value={shirtColor}
                onChange={event => onShirtColorChange(event.target.value)}
                aria-label={`${productLabel} uchun rangni tanlash`}
              />
            </label>
          </div>
        </div>

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
                if (file) loadImageToCanvas(file);
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

            <p className='hint-text'>
              Rasm yuklangandan so&apos;ng bosma hududida suring va
              kattalashtiring.
            </p>
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
              {GARMENT_STICKERS.map(sticker => (
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

        {activeTab === 'product' ? (
          <div className='panel'>
            <p className='hint-text'>Tez orada qo&apos;shiladi.</p>
          </div>
        ) : null}

        <div id='garment-layers-panel'>
          <FabricLayersPanel canvas={canvas} />
        </div>
      </div>
    </div>
  );
}
