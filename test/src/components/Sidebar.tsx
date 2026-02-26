import React, { useState } from 'react';
import { fabric } from 'fabric';
import { Image, Type, Smile, Settings } from 'lucide-react';

interface SidebarProps {
    canvas: fabric.Canvas | null;
    textureOffset: { x: number, y: number };
    setTextureOffset: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
    textureRepeat: { x: number, y: number };
    setTextureRepeat: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
}

export default function Sidebar({ canvas, textureOffset, setTextureOffset, textureRepeat, setTextureRepeat }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'image' | 'text' | 'stickers' | 'config'>('image');

    // Image Upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && canvas) {
            const url = URL.createObjectURL(file);
            fabric.Image.fromURL(url, (img) => {
                // scale down large images to fit the canvas height
                const scale = (canvas.height! * 0.95) / (img.height || 600);
                img.set({
                    left: 0, // FLUSH TO LEFT as requested
                    top: canvas.height! / 2,
                    originX: 'left',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    cornerStyle: 'circle',
                    transparentCorners: false
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        }
    };

    // Add Text Handler
    const handleAddText = () => {
        if (!canvas) return;
        const text = new fabric.IText('Tahrirlash uchun bosing', {
            left: 0, // FLUSH TO LEFT as requested
            top: canvas.height! / 2,
            originX: 'left',
            originY: 'center',
            fontFamily: 'sans-serif',
            fontSize: 70,
            fill: '#1e293b',
            cornerStyle: 'circle',
            transparentCorners: false
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    // Add Emoji / Icon Sticker
    const handleAddSticker = (emoji: string) => {
        if (!canvas) return;
        const text = new fabric.Text(emoji, {
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            originX: 'center',
            originY: 'center',
            fontSize: 80,
            cornerStyle: 'circle',
            transparentCorners: false
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
            activeObjects.forEach((obj) => {
                canvas.remove(obj);
            });
        }
    };

    return (
        <div className="modern-sidebar">
            <div className="sidebar-header">
                <h2>Dizayn Asboblari</h2>
                <p>Krujkaga rasm, matn va stiker qadab sozlang.</p>
            </div>

            <div className="tab-menu">
                <button className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                    <Image size={18} /> Rasm
                </button>
                <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
                    <Type size={18} /> Matn
                </button>
                <button className={`tab-btn ${activeTab === 'stickers' ? 'active' : ''}`} onClick={() => setActiveTab('stickers')}>
                    <Smile size={18} /> Stiker
                </button>
                <button className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
                    <Settings size={18} /> Sozlama
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'image' && (
                    <div className="panel">
                        <label className="action-btn primary">
                            Rasm yuklash
                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                        </label>
                        <p className="hint-text" style={{ marginBottom: '1rem' }}>Tavsiya: Yuqori sifatli shaffof (PNG) format.</p>
                    </div>
                )}

                {activeTab === 'text' && (
                    <div className="panel">
                        <button className="action-btn" onClick={handleAddText}>Yangi Matn Qo'shish</button>
                        <p className="hint-text">Matnni bevosita Print Area'da ikki marta bosib tahrirlang.</p>
                    </div>
                )}

                {activeTab === 'stickers' && (
                    <div className="panel">
                        <p className="hint-text">Stikerni tanlab qo'shing:</p>
                        <div className="sticker-grid">
                            {['⭐', '❤️', '🔥', '☕', '🐱', '🌹', '💻', '🚀'].map(emoji => (
                                <button key={emoji} className="sticker-btn" onClick={() => handleAddSticker(emoji)}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="panel">
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Print Chegaralarini Topish (Debug)</h4>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem' }}>
                            Kenglik Qamrovi (Repeat X): {textureRepeat.x.toFixed(2)}
                            <input
                                type="range" min="0.1" max="1" step="0.01"
                                value={textureRepeat.x}
                                onChange={e => setTextureRepeat(p => ({ ...p, x: parseFloat(e.target.value) }))}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem' }}>
                            Boshlanish Nuqtasi (Offset X): {textureOffset.x.toFixed(2)}
                            <input
                                type="range" min="-1" max="2" step="0.01"
                                value={textureOffset.x}
                                onChange={e => setTextureOffset(p => ({ ...p, x: parseFloat(e.target.value) }))}
                            />
                        </label>
                        <p className="hint-text">Ushbu sozlamalarni surib, rasmni ushlagichdan qochiring va aniq raqamlarni ayting.</p>
                    </div>
                )}

                <div className="global-actions">
                    <button className="action-btn danger" onClick={deleteSelected}>Tanlanganni O'chirish</button>
                </div>
            </div>
        </div>
    );
}
