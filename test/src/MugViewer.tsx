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
}

const MugModel = ({
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
}: Omit<MugModelProps, 'isInteracting' | 'rotationY'>) => {
    const fbx = useFBX('/teamugfbx.fbx');
    const [canvasTexture, setCanvasTexture] = useState<THREE.CanvasTexture | null>(null);

    const [centeringOffset, setCenteringOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

    // Initialize CanvasTexture from Fabric
    useEffect(() => {
        if (fabricCanvas) {
            const tex = new THREE.CanvasTexture(fabricCanvas.getElement());
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 16;
            setCanvasTexture(tex);
        }
    }, [fabricCanvas]);

    // Initial analysis for centering
    useEffect(() => {
        if (!fbx) return;

        // Reset any existing translations on children if necessary
        // but it's better to just compute the raw bounding box
        const rawBox = new THREE.Box3().setFromObject(fbx);

        const targetMeshes: THREE.Mesh[] = [];
        fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const name = child.name.toUpperCase();
                if (name.includes('PRINT') || name.includes('BODY') || name.includes('MUG')) {
                    targetMeshes.push(child as THREE.Mesh);
                }
            }
        });

        const bodyBox = new THREE.Box3();
        if (targetMeshes.length > 0) {
            targetMeshes.forEach(m => bodyBox.expandByObject(m));
        } else {
            bodyBox.copy(rawBox);
        }

        const bodyCenter = new THREE.Vector3();
        bodyBox.getCenter(bodyCenter);

        // This offset is in RAW FBX units
        setCenteringOffset(new THREE.Vector3(-bodyCenter.x, -rawBox.min.y, -bodyCenter.z));
    }, [fbx]);

    // Sync texture settings and apply materials
    useEffect(() => {
        if (canvasTexture) {
            canvasTexture.wrapS = THREE.RepeatWrapping;
            canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
            // ---------------------------------------------------------
            // PROFESSIONAL MAPPING CALIBRATION (REFINE)
            // - offset.x: 0.25 (moves seam away from front to handle)
            // - repeat.x: 0.85 (scales wrap to fit body circumference minus handle)
            // ---------------------------------------------------------
            canvasTexture.offset.set(textureOffset.x + 0.25, textureOffset.y);
            canvasTexture.repeat.set(textureRepeat.x * 0.85, 1.0);
            canvasTexture.needsUpdate = true;
        }

        if (!fbx) return;

        fbx.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
                const name = mesh.name.toUpperCase();

                // Professional logic: target body but exclude handle
                const isBody = name.includes('BODY') || name.includes('MUG') || name.includes('PRINT');
                const isHandle = name.includes('HANDLE');

                mesh.material = new THREE.MeshStandardMaterial({
                    map: (isBody && !isHandle) ? canvasTexture : null,
                    color: 0xffffff,
                    roughness: 0.08, // Extra sleek
                    metalness: 0.05,
                    transparent: isBody && !isHandle,
                });
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
    }, [fbx, canvasTexture, textureVersion, textureOffset.x, textureOffset.y, textureRepeat.x]);

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
}

export default function MugViewer({
    scale,
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
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
                shadows
                camera={{ position: [0, 2, 12], fov: 35 }}
                gl={{ preserveDrawingBuffer: true, antialias: true }}
            >
                <color attach="background" args={['#cbd5e1']} />

                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 10]} intensity={2.0} castShadow />
                <directionalLight position={[-10, 5, -10]} intensity={1.0} />
                <pointLight position={[0, 5, 5]} intensity={1.0} />

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
                        />
                    </group>
                </Suspense>

                <ContactShadows
                    position={[0, -1.49, 0]}
                    opacity={0.08} // Extremely soft shadow as requested
                    scale={15}
                    blur={4} // Very diffuse "everywhere" feel
                    far={2}
                    color="#000000"
                />
            </Canvas>
        </div>
    );
}
