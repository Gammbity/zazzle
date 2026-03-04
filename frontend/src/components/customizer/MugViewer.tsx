"use client";

import { useRef, Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { fabric } from 'fabric';
import { Camera } from 'lucide-react';

interface MugModelProps {
    fabricCanvas: fabric.Canvas | null;
    textureVersion: number;
    textureOffset: { x: number; y: number };
    textureRepeat: { x: number; y: number };
    mugColor: string;
}

const ProceduralMug = ({
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
    mugColor,
}: MugModelProps) => {
    // Basic Procedural Dimensions for Mug
    const radius = 2.0;
    const height = 4.0;
    const radialSegments = 64;
    const heightSegments = 1;

    // Solid Base geometries (Full 360 circle)
    const baseCylinderGeo = useMemo(() => new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments), [radius, height, radialSegments, heightSegments]);

    // The inner cylinder to give the mug walls some thickness
    const innerRadius = radius * 0.95;
    const innerGeo = useMemo(() => new THREE.CylinderGeometry(innerRadius, radius * 0.999, height + 0.01, radialSegments, heightSegments), [innerRadius, radius, height, radialSegments, heightSegments]);

    // Bottom inner face to seal the bottom
    const bottomGeo = useMemo(() => new THREE.CircleGeometry(innerRadius, radialSegments), [innerRadius, radialSegments]);

    // Handle geometry
    const tubeGeo = useMemo(() => new THREE.TorusGeometry(1.2, 0.3, 16, 32), []);

    // Print Decal geometry (Partial wrap, slightly larger, slightly shorter to leave the rim alone)
    const PRINT_COVERAGE = 0.85;
    const GAP = 1.0 - PRINT_COVERAGE;

    // Gap size in radians is GAP * 2 * PI. Half gap is GAP * PI.
    // The printed geometry should START at: PI/2 + GAP*PI.
    // And extend for PRINT_COVERAGE * 2 * PI.
    const thetaStart = Math.PI * 0.5 + Math.PI * GAP;
    const thetaLength = Math.PI * 2 * PRINT_COVERAGE;

    const decalRadius = radius + 0.002; // Slightly larger to prevent Z-fighting
    const decalHeight = height - 0.2; // Slightly shorter to keep the top and bottom rims plain

    // openEnded = true so it doesn't try to draw internal caps
    const decalGeo = useMemo(() => new THREE.CylinderGeometry(decalRadius, decalRadius, decalHeight, radialSegments, heightSegments, true, thetaStart, thetaLength), [decalRadius, decalHeight, radialSegments, heightSegments, thetaStart, thetaLength]);

    const [canvasTexture, setCanvasTexture] = useState<THREE.Texture | null>(null);

    // ── Update the texture dynamically from fabric canvas ─────────────────────
    useEffect(() => {
        if (!fabricCanvas) return;
        const url = fabricCanvas.toDataURL({ format: 'png', quality: 1.0 });
        new THREE.TextureLoader().load(url, tex => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 8;

            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;

            // The Fabric canvas contains the FULL 100% circumference, including the red margins.
            // But our outer geometry only covers 85% of the circumference.
            // We need to map only the middle 85% of the image onto the geometry.
            // So we start reading the texture from U = 0.075 (which is GAP / 2).
            // And we squeeze the texture so the geometry consumes exactly 85% of the image.
            const PRINT_COVERAGE = 0.85;
            const GAP = 1.0 - PRINT_COVERAGE;
            tex.offset.set(textureOffset.x + (GAP / 2), textureOffset.y);
            tex.repeat.set(textureRepeat.x * PRINT_COVERAGE, textureRepeat.y || 1);

            setCanvasTexture(prev => { prev?.dispose(); return tex; });
        });
    }, [fabricCanvas, textureVersion, textureOffset.x, textureOffset.y, textureRepeat.x]);

    // The entirely solid base mug (uses mugColor)
    const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: mugColor,
        roughness: 0.15,
        metalness: 0.1,
    }), [mugColor]);

    // The inner material (BackSide for thickness)
    const innerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: mugColor,
        roughness: 0.15,
        metalness: 0.1,
        side: THREE.BackSide,
    }), [mugColor]);

    // Outer decal material uses Canvas Texture
    const decalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ffffff', // base white for decal so colors pop
        map: canvasTexture || null,
        transparent: true, // transparent borders of canvas will let base object show through
        roughness: 0.15,
        metalness: 0.1,
    }), [canvasTexture]);

    return (
        <group rotation={[0, 0, 0]}>
            {/* Solid Base */}
            <mesh geometry={baseCylinderGeo} material={baseMaterial} />

            {/* Inner body to give thickness effect */}
            <mesh geometry={innerGeo} material={innerMaterial} />

            {/* Bottom seal */}
            <mesh geometry={bottomGeo} material={baseMaterial} position={[0, -height / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} />

            {/* Handle - attached to the side exactly at local +X where the gap is */}
            <mesh
                geometry={tubeGeo}
                material={baseMaterial}
                position={[radius + 0.6, 0.2, 0]}
            />

            {/* Print Decal layer wrapped around (offset slightly from surface) */}
            <mesh geometry={decalGeo} material={decalMaterial} />
        </group>
    );
};

/* ── Outer component: manages the Canvas wrapper ── */
interface MugViewerProps {
    scale: number;
    fabricCanvas: fabric.Canvas | null;
    textureVersion: number;
    textureOffset: { x: number; y: number };
    textureRepeat: { x: number; y: number };
    mugColor: string;
}

export default function MugViewer({
    fabricCanvas,
    textureVersion,
    textureOffset,
    textureRepeat,
    mugColor,
}: MugViewerProps) {
    const [rotationY, setRotationY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const lastX = useRef(0);

    const onPointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        lastX.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        setRotationY(prev => prev + dx * 0.01);
    };
    const onPointerUp = () => setIsDragging(false);

    const handleExport = () => {
        const c = document.querySelector('.canvas-wrapper canvas') as HTMLCanvasElement;
        if (!c) return;
        const a = document.createElement('a');
        a.download = 'mug-3d.png';
        a.href = c.toDataURL('image/png', 1.0);
        a.click();
    };

    return (
        <div
            className="canvas-wrapper"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <button
                className="action-btn primary"
                onClick={handleExport}
                style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 'auto' }}
                onPointerDown={e => e.stopPropagation()}
            >
                <Camera size={18} /> Eksport
            </button>

            <Canvas
                camera={{ position: [0, 2, 9], fov: 50 }}
                gl={{ preserveDrawingBuffer: true, antialias: true }}
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#cbd5e1']} />

                {/* Lighting setup specifically balanced for Procedural Geometry */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
                <pointLight position={[-5, 3, -5]} intensity={0.5} />

                <Suspense fallback={null}>
                    <group rotation={[0, rotationY, 0]} position={[0, 0, 0]} scale={0.8}>
                        <ProceduralMug
                            fabricCanvas={fabricCanvas}
                            textureVersion={textureVersion}
                            textureOffset={textureOffset}
                            textureRepeat={textureRepeat}
                            mugColor={mugColor}
                        />
                    </group>
                </Suspense>

                <ContactShadows
                    position={[0, -1.8, 0]}
                    opacity={0.3}
                    scale={10}
                    blur={2.5}
                    far={4}
                    color="#000000"
                />
            </Canvas>
        </div>
    );
}
