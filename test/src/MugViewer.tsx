import { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFBX, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { fabric } from 'fabric';
import { Camera } from 'lucide-react';

useFBX.preload('/teamugfbx.fbx');

interface MugModelProps {
    fabricCanvas: fabric.Canvas | null;
    textureVersion: number;
    textureOffset: { x: number; y: number };
    textureRepeat: { x: number; y: number };
    mugColor: string;
}

const MugModel = ({
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
    mugColor,
}: Omit<MugModelProps, 'isInteracting' | 'rotationY'>) => {
    const fbx = useFBX('/teamugfbx.fbx');
    const [canvasTexture, setCanvasTexture] = useState<THREE.Texture | null>(null);
    const [centeringOffset, setCenteringOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const bodyMeshes = useRef<THREE.Mesh[]>([]);
    // Auto-detected UV V-range of the mug body. Used to map canvas 1:1 onto the mug surface.
    const bodyUVRange = useRef<{ minV: number; maxV: number }>({ minV: 0, maxV: 1 });

    // ── FBX: Initialize mesh materials ──────────────────────────────────────
    // Runs once when FBX loads. Separates handle from body meshes.
    useEffect(() => {
        if (!fbx) return;

        const found: THREE.Mesh[] = [];
        const handles: THREE.Mesh[] = [];

        fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const name = mesh.name.toUpperCase();
                console.log('Mug Mesh Name:', name);

                if (name.includes('HANDLE')) {
                    handles.push(mesh);
                    // Handle: solid mug color, no texture
                    mesh.material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(mugColor),
                        transparent: false,
                    });
                } else {
                    found.push(mesh);
                    // Body / print area: ALWAYS WHITE material.
                    // Canvas texture provides all color (incl. background = mug color).
                    // If material color != white it would multiply-darken the texture.
                    mesh.material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color('#ffffff'),
                        transparent: false,
                    });
                }
            }
        });

        // If no body meshes found treat every non-handle mesh as body
        bodyMeshes.current = found.length > 0 ? found : [];

        // ── Analyse UV V-range — filter by vertex world-Y to exclude base & rim ──
        // Problem: naive min/max of ALL vertices includes the bottom disc (V≈0)
        // and rim seam, giving minV≈0, maxV≈1 → useless (same as repeat.y=1).
        // Fix: only scan vertices whose local Y is in the middle 75% of mug height
        // (skip bottom 20% = base, skip top 5% = rim edge).
        const bodyBox2 = new THREE.Box3();
        bodyMeshes.current.forEach(m => bodyBox2.expandByObject(m));
        const mugH = bodyBox2.max.y - bodyBox2.min.y;
        const yLow = bodyBox2.min.y + mugH * 0.20;  // skip base
        const yHigh = bodyBox2.max.y - mugH * 0.05;  // skip rim

        let minV = 1, maxV = 0;
        bodyMeshes.current.forEach(mesh => {
            const geo = mesh.geometry as THREE.BufferGeometry;
            const uvA = geo.attributes.uv;
            const posA = geo.attributes.position;
            if (!uvA || !posA) return;
            for (let i = 0; i < uvA.count; i++) {
                const y = posA.getY(i);
                if (y < yLow || y > yHigh) continue;   // skip base / rim
                const v = uvA.getY(i);
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
            }
        });

        const uvH = maxV - minV;
        if (uvH > 0.01 && uvH < 0.75) {
            // Reliable range — UV detection succeeded
            bodyUVRange.current = { minV, maxV };
            console.log('[MugModel] body UV V-range (filtered):', minV.toFixed(3), '→', maxV.toFixed(3));
        } else {
            // UV detection grabbed too much (base/rim leaked in).
            // Fallback: standard 11oz mug body is typically the upper 50% UV range.
            bodyUVRange.current = { minV: 0.5, maxV: 1.0 };
            console.warn('[MugModel] UV range unreliable (uvH=' + uvH.toFixed(3) + '), using fallback 0.5→1.0');
        }

        const rawBox = new THREE.Box3().setFromObject(fbx);
        const bodyBox = new THREE.Box3();
        if (bodyMeshes.current.length > 0) {
            bodyMeshes.current.forEach(m => bodyBox.expandByObject(m));
        } else {
            bodyBox.copy(rawBox);
        }
        const bodyCenter = new THREE.Vector3();
        bodyBox.getCenter(bodyCenter);
        setCenteringOffset(new THREE.Vector3(-bodyCenter.x, -rawBox.min.y, -bodyCenter.z));
    }, [fbx]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── mugColor → update ONLY handle material (body is always white) ─────────
    useEffect(() => {
        if (!fbx) return;
        fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.name.toUpperCase().includes('HANDLE')) {
                    (mesh.material as THREE.MeshBasicMaterial).color.set(mugColor);
                    (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
                }
            }
        });
    }, [fbx, mugColor]);

    // ── Generate texture from canvas ──────────────────────────────────────────
    useEffect(() => {
        if (!fabricCanvas) return;

        const updateTexture = () => {
            // quality: 1.0 — every pixel the user placed on canvas appears on mug
            const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1.0 });
            const loader = new THREE.TextureLoader();
            loader.load(dataUrl, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 8;
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping; // allow full vertical range

                // Compute Y mapping from actual UV range so full canvas is visible
                const { minV, maxV } = bodyUVRange.current;
                const uvH = maxV - minV;
                // repeat.y = 1/uvH  → canvas fills the exact V-span of the mug body
                // offset.y = -minV/uvH → align bottom of canvas to bottom of mug body
                const ry = uvH > 0.01 ? 1 / uvH : 1;
                const oy = uvH > 0.01 ? -minV / uvH : 0;

                tex.offset.set(textureOffset.x + 0.5, oy + textureOffset.y);
                tex.repeat.set(textureRepeat.x, ry);

                setCanvasTexture(prev => {
                    if (prev) prev.dispose();
                    return tex;
                });
            });
        };

        updateTexture();
    }, [fabricCanvas, textureVersion]);

    // ── Apply texture to all body meshes ─────────────────────────────────────
    useEffect(() => {
        if (!canvasTexture) return;

        const targets: THREE.Mesh[] = bodyMeshes.current.length > 0
            ? bodyMeshes.current
            : (() => {
                const all: THREE.Mesh[] = [];
                fbx?.traverse(c => {
                    if ((c as THREE.Mesh).isMesh && !c.name.toUpperCase().includes('HANDLE')) {
                        all.push(c as THREE.Mesh);
                    }
                });
                return all;
            })();

        targets.forEach(mesh => {
            const mat = mesh.material as THREE.MeshBasicMaterial;
            mat.map = canvasTexture;
            mat.needsUpdate = true;
        });

        // Re-compute Y mapping from UV range (same formula as texture generation)
        const { minV, maxV } = bodyUVRange.current;
        const uvH = maxV - minV;
        const ry = uvH > 0.01 ? 1 / uvH : 1;
        const oy = uvH > 0.01 ? -minV / uvH : 0;

        canvasTexture.offset.set(textureOffset.x + 0.5, oy + textureOffset.y);
        canvasTexture.repeat.set(textureRepeat.x, ry);
        canvasTexture.needsUpdate = true;
    }, [canvasTexture, textureOffset.x, textureOffset.y, textureRepeat.x]);

    return (
        <group position={[centeringOffset.x, centeringOffset.y, centeringOffset.z]}>
            <primitive object={fbx} />
        </group>
    );
};

// ── Outer component — manages pointer drag & auto-rotation ──────────────────

interface MugViewerProps {
    scale: number;
    fabricCanvas: fabric.Canvas | null;
    textureVersion: number;
    textureOffset: { x: number; y: number };
    textureRepeat: { x: number; y: number };
    mugColor: string;
}

export default function MugViewer({
    scale,
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
    mugColor,
}: MugViewerProps) {
    const [rotationY, setRotationY] = useState(0); // Start facing forward
    const [isDragging, setIsDragging] = useState(false);
    const lastX = useRef(0);
    const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoY = useRef(0);
    const isAutoRotating = useRef(true);

    // Auto-rotate loop
    useEffect(() => {
        const step = 16; // ~60fps interval
        autoRotateRef.current = setInterval(() => {
            if (isAutoRotating.current) {
                autoY.current += 0.004;
                setRotationY(autoY.current);
            }
        }, step);
        return () => {
            if (autoRotateRef.current) clearInterval(autoRotateRef.current);
        };
    }, []);

    const pauseAutoRotate = () => {
        isAutoRotating.current = false;
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
            autoY.current = rotationY;
            isAutoRotating.current = true;
        }, 3000); // Resume after 3s of idle
    };

    const onPointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        lastX.current = e.clientX;
        pauseAutoRotate();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        const next = rotationY + dx * 0.01;
        autoY.current = next;
        setRotationY(next);
    };

    const onPointerUp = () => {
        setIsDragging(false);
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
            autoY.current = rotationY;
            isAutoRotating.current = true;
        }, 3000); // Resume after 3s of idle
    };

    const handleExportSnapshot = () => {
        const canvasEl = document.querySelector('.canvas-wrapper canvas') as HTMLCanvasElement;
        if (canvasEl) {
            const a = document.createElement('a');
            a.download = 'krujka-dizayn-3d.png';
            a.href = canvasEl.toDataURL('image/png', 1.0);
            a.click();
        }
    };

    return (
        <div
            className="canvas-wrapper"
            style={{ position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <button
                className="action-btn primary"
                onClick={handleExportSnapshot}
                style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, width: 'auto' }}
                onPointerDown={e => e.stopPropagation()}
            >
                <Camera size={18} /> Eksport
            </button>

            <Canvas
                camera={{ position: [0, 2, 12], fov: 35 }}
                gl={{ preserveDrawingBuffer: true, antialias: true }}
            >
                <color attach="background" args={['#cbd5e1']} />

                {/* Simple uniform lighting for consistent appearance */}
                <ambientLight intensity={1.2} />

                <Suspense fallback={null}>
                    {/* HUB: Rotation + Overall Scale */}
                    <group
                        rotation={[0.08, rotationY, 0]}
                        position={[0, -1.5, 0]}
                        scale={scale * 0.2} // Further reduced scale for safety
                    >
                        <MugModel
                            fabricCanvas={fabricCanvas}
                            textureVersion={textureVersion}
                            textureOffset={textureOffset}
                            textureRepeat={textureRepeat}
                            mugColor={mugColor}
                        />
                    </group>
                </Suspense>

                {/* Very subtle ground shadow for spatial awareness - doesn't affect mug texture */}
                <ContactShadows
                    position={[0, -1.49, 0]}
                    opacity={0.03} // Extremely subtle shadow
                    scale={10}
                    blur={5}
                    far={1.5}
                    color="#000000"
                />
            </Canvas>
        </div>
    );
}
