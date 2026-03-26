import React, { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import {
  Image,
  Type,
  Smile,
  Settings,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlignCenter,
  Maximize2,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  canvas: fabric.Canvas | null;
  textureOffset: { x: number; y: number };
  setTextureOffset: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  textureRepeat: { x: number; y: number };
  setTextureRepeat: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  mugColor: string;
  setMugColor: (color: string) => void;
}

const MUG_COLORS = [
  { name: 'Oq', value: '#ffffff' },
  { name: 'Qora', value: '#1a1a1a' },
  { name: "Ko'k", value: '#1e3a8a' },
  { name: 'Qizil', value: '#991b1b' },
  { name: 'Yashil', value: '#065f46' },
  { name: 'Sariq', value: '#ca8a04' },
  { name: 'Binafsha', value: '#6d28d9' },
];

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

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageState {
  thumbnail: string;
  name: string;
  sizeMb: string;
}

export default function Sidebar({
  canvas,
  textureOffset,
  setTextureOffset,
  textureRepeat,
  setTextureRepeat,
  mugColor,
  setMugColor,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<
    'image' | 'text' | 'stickers' | 'config'
  >('image');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [textColor, setTextColor] = useState('#2563eb');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Core image loading logic ────────────────────────────────────────────
  const loadImageToCanvas = useCallback(
    (file: File) => {
      if (!canvas) return;

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadStatus('error');
        setErrorMsg(
          `Noto'g'ri fayl turi: ${file.type || "noma'lum"}. PNG, JPG, WebP, GIF yuboring.`
        );
        return;
      }

      // Validate size
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        setUploadStatus('error');
        setErrorMsg(
          `Fayl hajmi ${sizeMb.toFixed(1)} MB - ${MAX_FILE_SIZE_MB} MB dan oshmasligi kerak.`
        );
        return;
      }

      setUploadStatus('loading');
      setErrorMsg('');

      const reader = new FileReader();
      reader.onload = event => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          setUploadStatus('error');
          setErrorMsg("Faylni o'qib bo'lmadi. Qayta urinib ko'ring.");
          return;
        }

        // Build thumbnail synchronously from dataUrl (safe, no revoke issue)
        setImageState({
          thumbnail: dataUrl,
          name: file.name,
          sizeMb: sizeMb.toFixed(2),
        });

        fabric.Image.fromURL(
          dataUrl,
          img => {
            if (!img || !img.width || !img.height) {
              setUploadStatus('error');
              setErrorMsg("Rasm yuklanmadi. Boshqa fayl sinab ko'ring.");
              return;
            }

            const canvasW = canvas.getWidth();
            const canvasH = canvas.getHeight();
            const imgW = img.width;
            const imgH = img.height;

            // Fill mode: cover the entire canvas (no blank areas)
            const scale = Math.max(canvasW / imgW, canvasH / imgH);

            img.set({
              left: canvasW / 2,
              top: canvasH / 2,
              originX: 'center',
              originY: 'center',
              scaleX: scale,
              scaleY: scale,
              hasBorders: true,
              hasControls: true,
              cornerSize: 12,
              borderColor: '#3b82f6',
              cornerColor: '#3b82f6',
              transparentCorners: false,
              cornerStyle: 'rect',
              selectable: true,
              evented: true,
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            setUploadStatus('success');
          },
          { crossOrigin: 'anonymous' }
        );
      };
      reader.onerror = () => {
        setUploadStatus('error');
        setErrorMsg("Faylni o'qishda xatolik yuz berdi.");
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [canvas]
  );

  // ── File input change ───────────────────────────────────────────────────
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageToCanvas(file);
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImageToCanvas(file);
  };

  // ── Image fit helpers ───────────────────────────────────────────────────
  const fitImageToFill = () => {
    if (!canvas) return;
    const activeImg = canvas.getActiveObject() as fabric.Image;
    if (!activeImg || activeImg.type !== 'image') return;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();
    const imgW = activeImg.width! * (activeImg.scaleX || 1);
    const imgH = activeImg.height! * (activeImg.scaleY || 1);
    const rawW = activeImg.width!;
    const rawH = activeImg.height!;
    const scale = Math.max(canvasW / rawW, canvasH / rawH);
    activeImg.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasW / 2,
      top: canvasH / 2,
      originX: 'center',
      originY: 'center',
    });
    activeImg.setCoords();
    canvas.renderAll();
    void imgW;
    void imgH;
  };

  const fitImageToContain = () => {
    if (!canvas) return;
    const activeImg = canvas.getActiveObject() as fabric.Image;
    if (!activeImg || activeImg.type !== 'image') return;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();
    const rawW = activeImg.width!;
    const rawH = activeImg.height!;
    const scale = Math.min(canvasW / rawW, canvasH / rawH);
    activeImg.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasW / 2,
      top: canvasH / 2,
      originX: 'center',
      originY: 'center',
    });
    activeImg.setCoords();
    canvas.renderAll();
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMsg('');
    setImageState(null);
  };

  const applyTextColor = (color: string) => {
    setTextColor(color);

    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (['i-text', 'textbox', 'text'].includes(activeObject.type ?? '')) {
      activeObject.set('fill', color);
      canvas.requestRenderAll();
      canvas.fire('object:modified', { target: activeObject });
    }
  };

  // ── Text / Stickers / Delete helpers ───────────────────────────────────
  const handleAddText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Tahrirlash uchun bosing', {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'sans-serif',
      fontSize: 70,
      fill: textColor,
      hasBorders: true,
      hasControls: true,
      cornerSize: 12,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      transparentCorners: false,
      selectable: true,
      evented: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const handleAddSticker = (emoji: string) => {
    if (!canvas) return;
    const text = new fabric.Text(emoji, {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 80,
      hasBorders: true,
      hasControls: true,
      cornerSize: 12,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      transparentCorners: false,
      selectable: true,
      evented: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.requestRenderAll();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className='modern-sidebar'>
      <div className='sidebar-header'>
        <h2>Dizayn asboblari</h2>
        <p>Professional darajadagi tahrirlash tajribasi.</p>
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
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={20} />
          <span>Sozlama</span>
        </button>
      </div>

      <div className='tab-content'>
        {/* ── IMAGE TAB ─────────────────────────────────────────── */}
        {activeTab === 'image' && (
          <div className='panel'>
            {/* Drop zone */}
            <div
              className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${uploadStatus === 'error' ? 'upload-error-zone' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role='button'
              tabIndex={0}
              onKeyDown={e =>
                e.key === 'Enter' && fileInputRef.current?.click()
              }
              aria-label='Rasm yuklash'
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
              ) : uploadStatus === 'error' ? (
                <div className='upload-zone-inner'>
                  <AlertCircle size={32} color='#ef4444' />
                  <p className='upload-error-text'>{errorMsg}</p>
                  <span className='upload-retry'>Qayta urinish</span>
                </div>
              ) : imageState && uploadStatus === 'success' ? (
                <div className='upload-zone-inner'>
                  <CheckCircle size={24} color='#22c55e' />
                  <p className='upload-success-text'>Yuklandi!</p>
                  <p className='upload-filename'>{imageState.name}</p>
                </div>
              ) : (
                <div className='upload-zone-inner'>
                  <Upload size={32} />
                  <p>
                    <strong>Rasm tashlang</strong> yoki bosing
                  </p>
                  <span className='upload-hint'>
                    PNG, JPG, WebP - eng ko'pi {MAX_FILE_SIZE_MB} MB
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail + info */}
            {imageState && (
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
                  onClick={resetUpload}
                  title='Tozalash'
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Fit controls */}
            <div className='fit-controls'>
              <p className='fit-label'>Tanlangan rasmni moslashtirish:</p>
              <div className='fit-buttons'>
                <button
                  className='action-btn'
                  onClick={fitImageToFill}
                  title="To'liq to'ldirish"
                >
                  <Maximize2 size={16} /> To'ldirish
                </button>
                <button
                  className='action-btn'
                  onClick={fitImageToContain}
                  title='Markazlash'
                >
                  <AlignCenter size={16} /> Markazlash
                </button>
              </div>
            </div>

            <p className='hint-text'>
              Rasm yuklangandan so'ng bosma hududida suring va kattalashtiring.
            </p>
          </div>
        )}

        {/* ── TEXT TAB ──────────────────────────────────────────── */}
        {activeTab === 'text' && (
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
                  onChange={e => applyTextColor(e.target.value)}
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
            <p className='hint-text'>
              Matnni tahrirlash uchun bosma hududi ustiga ikki marta bosing.
            </p>
          </div>
        )}

        {/* ── STICKERS TAB ──────────────────────────────────────── */}
        {activeTab === 'stickers' && (
          <div className='panel'>
            <div className='sticker-grid'>
              {[
                '\u2B50',
                '\u2764\uFE0F',
                '\uD83D\uDD25',
                '\u2615',
                '\uD83D\uDC31',
                '\uD83C\uDF39',
                '\uD83D\uDCBB',
                '\uD83D\uDE80',
                '\uD83C\uDFA8',
                '\uD83C\uDFB5',
                '\uD83C\uDF08',
                '\u2728',
              ].map(emoji => (
                <button
                  key={emoji}
                  className='sticker-btn'
                  onClick={() => handleAddSticker(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFIG TAB ────────────────────────────────────────── */}
        {activeTab === 'config' && (
          <div className='panel'>
            <div className='config-section'>
              <h4 className='config-title'>Krujka rangi</h4>
              <div className='color-palette'>
                {MUG_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setMugColor(color.value)}
                    className='color-swatch'
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    aria-pressed={mugColor === color.value}
                  >
                    {mugColor === color.value && (
                      <CheckCircle
                        size={14}
                        color={color.value === '#ffffff' ? '#3b82f6' : 'white'}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className='config-section'>
              <h4 className='config-title'>To'qima sozlamalari</h4>
              <label className='slider-label'>
                <span>Takrorlash X: {textureRepeat.x.toFixed(2)}</span>
                <input
                  type='range'
                  min='0.1'
                  max='1'
                  step='0.01'
                  value={textureRepeat.x}
                  onChange={e =>
                    setTextureRepeat(p => ({
                      ...p,
                      x: parseFloat(e.target.value),
                    }))
                  }
                />
              </label>
              <label className='slider-label'>
                <span>Siljitish X: {textureOffset.x.toFixed(2)}</span>
                <input
                  type='range'
                  min='-1'
                  max='2'
                  step='0.01'
                  value={textureOffset.x}
                  onChange={e =>
                    setTextureOffset(p => ({
                      ...p,
                      x: parseFloat(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
          </div>
        )}

        {/* ── Global delete ─────────────────────────────────────── */}
        <div className='global-actions'>
          <button className='action-btn danger' onClick={deleteSelected}>
            <Trash2 size={16} /> Tanlanganni o'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
