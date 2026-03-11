"use client";

import React, { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { Image, Type, Smile, Upload, X, CheckCircle, AlertCircle, Loader2, AlignCenter, Maximize2, Trash2 } from 'lucide-react';

interface BusinessCardSidebarProps {
    canvas: fabric.Canvas | null;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageState {
    thumbnail: string;
    name: string;
    sizeMb: string;
}

export default function BusinessCardSidebar({
    canvas
}: BusinessCardSidebarProps) {
    const [activeTab, setActiveTab] = useState<'image' | 'text' | 'stickers'>('image');
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [imageState, setImageState] = useState<ImageState | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadImageToCanvas = useCallback((file: File) => {
        if (!canvas) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setUploadStatus('error');
            setErrorMsg(`Noto'g'ri fayl turi: ${file.type || 'noma\'lum'}. PNG, JPG, WebP, GIF yuboring.`);
            return;
        }

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > MAX_FILE_SIZE_MB) {
            setUploadStatus('error');
            setErrorMsg(`Fayl hajmi ${sizeMb.toFixed(1)} MB — ${MAX_FILE_SIZE_MB} MB dan oshmasligi kerak.`);
            return;
        }

        setUploadStatus('loading');
        setErrorMsg('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) {
                setUploadStatus('error');
                setErrorMsg("Faylni o'qib bo'lmadi. Qayta urinib ko'ring.");
                return;
            }

            setImageState({
                thumbnail: dataUrl,
                name: file.name,
                sizeMb: sizeMb.toFixed(2),
            });

            fabric.Image.fromURL(dataUrl, (img) => {
                if (!img || !img.width || !img.height) {
                    setUploadStatus('error');
                    setErrorMsg("Rasm yuklanmadi. Boshqa fayl sinab ko'ring.");
                    return;
                }

                const canvasW = canvas.getWidth();
                const canvasH = canvas.getHeight();
                const imgW = img.width;
                const imgH = img.height;

                const scale = Math.min(canvasW / imgW, canvasH / imgH) * 0.8;

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
                    selectable: true,
                    evented: true,
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                setUploadStatus('success');
            }, { crossOrigin: 'anonymous' });
        };
        reader.onerror = () => {
            setUploadStatus('error');
            setErrorMsg("Faylni o'qishda xatolik yuz berdi.");
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [canvas]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadImageToCanvas(file);
    };

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

    const fitImageToFill = () => {
        if (!canvas) return;
        const activeImg = canvas.getActiveObject() as fabric.Image;
        if (!activeImg || activeImg.type !== 'image') return;
        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const rawW = activeImg.width!;
        const rawH = activeImg.height!;
        const scale = Math.max(canvasW / rawW, canvasH / rawH);
        activeImg.set({ scaleX: scale, scaleY: scale, left: canvasW / 2, top: canvasH / 2, originX: 'center', originY: 'center' });
        activeImg.setCoords();
        canvas.renderAll();
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
        activeImg.set({ scaleX: scale, scaleY: scale, left: canvasW / 2, top: canvasH / 2, originX: 'center', originY: 'center' });
        activeImg.setCoords();
        canvas.renderAll();
    };

    const resetUpload = () => {
        setUploadStatus('idle');
        setErrorMsg('');
        setImageState(null);
    };

    const handleAddText = () => {
        if (!canvas) return;
        const text = new fabric.IText('Tashrif Qog\'ozi Matni', {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            fontFamily: 'sans-serif',
            fontSize: 24,
            fill: '#1e293b',
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
            fontSize: 40,
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

    return (
        <div className="modern-sidebar">
            <div className="sidebar-header">
                <h2>Tashrif Qog'ozi Dizayneri</h2>
                <p>O'z biznes kartangizni yarating.</p>
            </div>

            <div className="tab-menu">
                <button className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                    <Image size={20} />
                    <span>Rasm</span>
                </button>
                <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
                    <Type size={20} />
                    <span>Matn</span>
                </button>
                <button className={`tab-btn ${activeTab === 'stickers' ? 'active' : ''}`} onClick={() => setActiveTab('stickers')}>
                    <Smile size={20} />
                    <span>Stiker</span>
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'image' && (
                    <div className="panel">
                        <div
                            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${uploadStatus === 'error' ? 'upload-error-zone' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ALLOWED_TYPES.join(',')}
                                onChange={handleFileInputChange}
                                hidden
                            />

                            {uploadStatus === 'loading' ? (
                                <div className="upload-zone-inner">
                                    <Loader2 size={32} className="spin-icon" />
                                    <p>Yuklanmoqda…</p>
                                </div>
                            ) : uploadStatus === 'error' ? (
                                <div className="upload-zone-inner">
                                    <AlertCircle size={32} color="#ef4444" />
                                    <p className="upload-error-text">{errorMsg}</p>
                                    <span className="upload-retry">Qayta urinish ↩</span>
                                </div>
                            ) : imageState && uploadStatus === 'success' ? (
                                <div className="upload-zone-inner">
                                    <CheckCircle size={24} color="#22c55e" />
                                    <p className="upload-success-text">Yuklandi!</p>
                                    <p className="upload-filename">{imageState.name}</p>
                                </div>
                            ) : (
                                <div className="upload-zone-inner">
                                    <Upload size={32} />
                                    <p><strong>Rasm tashlang</strong> yoki bosing</p>
                                    <span className="upload-hint">PNG, JPG, WebP · Max {MAX_FILE_SIZE_MB} MB</span>
                                </div>
                            )}
                        </div>

                        {imageState && (
                            <div className="thumbnail-card">
                                <img src={imageState.thumbnail} alt="preview" className="thumbnail-img" />
                                <div className="thumbnail-info">
                                    <p className="thumbnail-name">{imageState.name}</p>
                                    <p className="thumbnail-size">{imageState.sizeMb} MB</p>
                                </div>
                                <button className="thumbnail-remove" onClick={resetUpload} title="Tozalash">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="fit-controls">
                            <p className="fit-label">Tanlangan rasmni moslashtirish:</p>
                            <div className="fit-buttons">
                                <button className="action-btn" onClick={fitImageToFill} title="To'liq to'ldirish">
                                    <Maximize2 size={16} /> To'ldirish
                                </button>
                                <button className="action-btn" onClick={fitImageToContain} title="Markazlash">
                                    <AlignCenter size={16} /> Markazlash
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'text' && (
                    <div className="panel">
                        <button className="action-btn primary" onClick={handleAddText}>
                            <Type size={16} /> Yangi Matn Qo'shish
                        </button>
                    </div>
                )}

                {activeTab === 'stickers' && (
                    <div className="panel">
                        <div className="sticker-grid">
                            {['🏢', '📞', '🤝', '📧', '💼', '📌', '💻', '🚀', '🎨', '🔥', '🎉', '✨'].map(emoji => (
                                <button key={emoji} className="sticker-btn" onClick={() => handleAddSticker(emoji)}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="global-actions">
                    <button className="action-btn danger" onClick={deleteSelected}>
                        <Trash2 size={16} /> Tanlanganni O'chirish
                    </button>
                </div>
            </div>
        </div>
    );
}
