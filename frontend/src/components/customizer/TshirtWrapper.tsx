import { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import {
  Image,
  Type,
  Smile,
  Trash2,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Maximize2,
  AlignCenter,
} from 'lucide-react';
import TshirtViewer from './TshirtViewer';
import TshirtPrintEditor from './TshirtPrintEditor';
import './customizer.css';

const TSHIRT_COLORS = [
  { name: 'Oq', value: '#ffffff' },
  { name: 'Qora', value: '#1a1a1a' },
  { name: 'Kulrang', value: '#9ca3af' },
  { name: "To'q ko'k", value: '#1e3a8a' },
  { name: 'Qizil', value: '#991b1b' },
  { name: 'Yashil', value: '#065f46' },
  { name: "Sariq", value: '#eab308' },
  { name: "Binafsha", value: '#7c3aed' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const STICKERS = [
  '⭐', '❤️', '🔥', '☕', '🐱', '🌹',
  '💻', '🚀', '🎨', '🎵', '🌈', '✨',
];

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const MAX_FILE_SIZE_MB = 10;

type Step = 'design' | 'size';
type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export default function TshirtWrapper() {
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [frontTextureUrl, setFrontTextureUrl] = useState('');
  const [backTextureUrl, setBackTextureUrl] = useState('');
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');

  const [step, setStep] = useState<Step>('design');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [showStickers, setShowStickers] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageState, setImageState] = useState<{
    thumbnail: string;
    name: string;
    sizeMb: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCanvasReady = (canvas: fabric.Canvas) => setFabricCanvas(canvas);

  const handleTextureUpdate = (url: string, side: 'front' | 'back') => {
    if (side === 'front') setFrontTextureUrl(url);
    else setBackTextureUrl(url);
  };

  const loadImageToCanvas = useCallback(
    (file: File) => {
      if (!fabricCanvas) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadStatus('error');
        setErrorMsg(`Noto'g'ri fayl turi. PNG, JPG, WebP yuboring.`);
        return;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        setUploadStatus('error');
        setErrorMsg(`Fayl hajmi ${sizeMb.toFixed(1)} MB - ${MAX_FILE_SIZE_MB} MB dan oshmasligi kerak.`);
        return;
      }

      setUploadStatus('loading');
      setErrorMsg('');

      const reader = new FileReader();
      reader.onload = event => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          setUploadStatus('error');
          setErrorMsg("Faylni o'qib bo'lmadi.");
          return;
        }

        setImageState({ thumbnail: dataUrl, name: file.name, sizeMb: sizeMb.toFixed(2) });

        fabric.Image.fromURL(
          dataUrl,
          img => {
            if (!img || !img.width || !img.height) {
              setUploadStatus('error');
              setErrorMsg("Rasm yuklanmadi.");
              return;
            }
            const cW = fabricCanvas.getWidth();
            const cH = fabricCanvas.getHeight();
            const scale = Math.min(cW / img.width!, cH / img.height!) * 0.8;
            img.set({
              left: cW / 2,
              top: cH / 2,
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
            });
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [fabricCanvas]
  );

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMsg('');
    setImageState(null);
  };

  const handleAddText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.Textbox('Tahrirlash uchun bosing', {
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'sans-serif',
      fontSize: 40,
      fill: '#1e293b',
      width: 300,
      textAlign: 'center',
      hasBorders: true,
      hasControls: true,
      cornerSize: 12,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      transparentCorners: false,
      editable: true,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    setShowStickers(false);
    setShowUploadPanel(false);
  };

  const handleAddSticker = (emoji: string) => {
    if (!fabricCanvas) return;
    const text = new fabric.Text(emoji, {
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 60,
      hasBorders: true,
      hasControls: true,
      cornerSize: 12,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      transparentCorners: false,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    setShowStickers(false);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObjects();
    if (active.length) {
      fabricCanvas.discardActiveObject();
      active.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.requestRenderAll();
    }
  };

  const fitFill = () => {
    if (!fabricCanvas) return;
    const img = fabricCanvas.getActiveObject() as fabric.Image;
    if (!img || img.type !== 'image') return;
    const scale = Math.max(fabricCanvas.getWidth() / img.width!, fabricCanvas.getHeight() / img.height!);
    img.set({ scaleX: scale, scaleY: scale, left: fabricCanvas.getWidth() / 2, top: fabricCanvas.getHeight() / 2, originX: 'center', originY: 'center' });
    img.setCoords();
    fabricCanvas.renderAll();
  };

  const fitContain = () => {
    if (!fabricCanvas) return;
    const img = fabricCanvas.getActiveObject() as fabric.Image;
    if (!img || img.type !== 'image') return;
    const scale = Math.min(fabricCanvas.getWidth() / img.width!, fabricCanvas.getHeight() / img.height!);
    img.set({ scaleX: scale, scaleY: scale, left: fabricCanvas.getWidth() / 2, top: fabricCanvas.getHeight() / 2, originX: 'center', originY: 'center' });
    img.setCoords();
    fabricCanvas.renderAll();
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Iltimos, avval o'lcham tanlang");
      return;
    }
    alert(`Savatga qo'shildi: O'lcham ${selectedSize} × ${quantity} dona`);
  };

  return (
    <div className="app-container" style={{ overflow: 'hidden' }}>
      {/* ── LEFT COLUMN ── */}
      <div className="tshirt-left-col">
        {/* Color swatches – at the very top of the left box */}
        <div className="tshirt-color-bar">
          <span className="tshirt-color-label">Rang:</span>
          <div className="tshirt-color-swatches">
            {TSHIRT_COLORS.map(c => (
              <button
                key={c.value}
                className="color-swatch"
                style={{ backgroundColor: c.value }}
                onClick={() => setShirtColor(c.value)}
                title={c.name}
                aria-pressed={shirtColor === c.value}
              >
                {shirtColor === c.value && (
                  <CheckCircle size={14} color={c.value === '#ffffff' ? '#3b82f6' : 'white'} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Front / Back toggle */}
        <div className="tshirt-view-toggle">
          <button
            className={`action-btn ${viewSide === 'front' ? 'primary' : ''}`}
            onClick={() => setViewSide('front')}
          >
            Old tomoni
          </button>
          <button
            className={`action-btn ${viewSide === 'back' ? 'primary' : ''}`}
            onClick={() => setViewSide('back')}
          >
            Orqa tomoni
          </button>
        </div>

        {/* T-shirt 3-D preview */}
        <div className="tshirt-viewer-wrap">
          <TshirtViewer
            textureUrl={viewSide === 'front' ? frontTextureUrl : backTextureUrl}
            shirtColor={shirtColor}
            viewSide={viewSide}
          />
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="tshirt-right-col">

        {/* ── STEP 1: Design editor (always mounted; hidden on size step) ── */}
        <div style={{ display: step === 'design' ? 'flex' : 'none', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <h2 className="right-panel-title">Dizayn yarating</h2>

          {/* Compact toolbar */}
          <div className="design-toolbar">
            <button
              className={`tool-btn ${showUploadPanel ? 'active' : ''}`}
              onClick={() => { setShowUploadPanel(v => !v); setShowStickers(false); }}
            >
              <Image size={16} /> Rasm
            </button>
            <button className="tool-btn" onClick={handleAddText}>
              <Type size={16} /> Matn
            </button>
            <button
              className={`tool-btn ${showStickers ? 'active' : ''}`}
              onClick={() => { setShowStickers(v => !v); setShowUploadPanel(false); }}
            >
              <Smile size={16} /> Stiker
            </button>
            <button className="tool-btn danger" onClick={deleteSelected} title="Tanlanganni o'chirish">
              <Trash2 size={16} />
            </button>
          </div>

          {/* Upload panel */}
          {showUploadPanel && (
            <div className="tool-panel">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={e => { const f = e.target.files?.[0]; if (f) loadImageToCanvas(f); }}
                hidden
              />
              <div
                className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${uploadStatus === 'error' ? 'upload-error-zone' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadImageToCanvas(f); }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                {uploadStatus === 'loading' ? (
                  <div className="upload-zone-inner"><Loader2 size={28} className="spin-icon" /><p>Yuklanmoqda...</p></div>
                ) : uploadStatus === 'error' ? (
                  <div className="upload-zone-inner"><AlertCircle size={28} color="#ef4444" /><p className="upload-error-text">{errorMsg}</p><span className="upload-retry">Qayta urinish</span></div>
                ) : uploadStatus === 'success' && imageState ? (
                  <div className="upload-zone-inner"><CheckCircle size={22} color="#22c55e" /><p className="upload-success-text">Yuklandi!</p><p className="upload-filename">{imageState.name}</p></div>
                ) : (
                  <div className="upload-zone-inner"><Upload size={28} /><p><strong>Rasm tashlang</strong> yoki bosing</p><span className="upload-hint">PNG, JPG, WebP – max {MAX_FILE_SIZE_MB} MB</span></div>
                )}
              </div>

              {imageState && (
                <div className="thumbnail-card" style={{ marginTop: '8px' }}>
                  <img src={imageState.thumbnail} alt="preview" className="thumbnail-img" />
                  <div className="thumbnail-info">
                    <p className="thumbnail-name">{imageState.name}</p>
                    <p className="thumbnail-size">{imageState.sizeMb} MB</p>
                  </div>
                  <button className="thumbnail-remove" onClick={resetUpload}><X size={15} /></button>
                </div>
              )}

              <div className="fit-buttons" style={{ marginTop: '8px' }}>
                <button className="action-btn" onClick={fitFill}><Maximize2 size={14} /> To'ldirish</button>
                <button className="action-btn" onClick={fitContain}><AlignCenter size={14} /> Markazlash</button>
              </div>
            </div>
          )}

          {/* Stickers panel */}
          {showStickers && (
            <div className="tool-panel">
              <div className="sticker-grid">
                {STICKERS.map(e => (
                  <button key={e} className="sticker-btn" onClick={() => handleAddSticker(e)}>{e}</button>
                ))}
              </div>
            </div>
          )}

          {/* 2-D Print editor canvas */}
          <div className="print-editor-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <TshirtPrintEditor
              onCanvasReady={handleCanvasReady}
              onTextureUpdate={handleTextureUpdate}
              viewSide={viewSide}
            />
          </div>

          {/* Next button */}
          <button
            className="action-btn primary"
            style={{ fontSize: '1rem', padding: '0.85rem', gap: '8px' }}
            onClick={() => setStep('size')}
          >
            Keyingi <ArrowRight size={18} />
          </button>
        </div>

        {/* ── STEP 2: Size & quantity ── */}
        {step === 'size' && (
          <div className="size-selector-panel">
            <h2 className="right-panel-title">O'lcham va miqdor</h2>

            <div className="size-section">
              <p className="size-label">O'lchamni tanlang:</p>
              <div className="size-grid-buttons">
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`size-btn ${selectedSize === s ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="quantity-section">
              <p className="qty-label">Miqdori:</p>
              <div className="qty-row">
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-value">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>

            <button
              className="action-btn primary add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              <ShoppingCart size={18} /> Savatga qo'shish
            </button>

            <button
              className="action-btn"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setStep('design')}
            >
              <ArrowLeft size={16} /> Orqaga – dizaynni tahrirlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
