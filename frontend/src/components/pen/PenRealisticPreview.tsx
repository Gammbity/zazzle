'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import { Camera, RotateCcw } from 'lucide-react';
import {
  ClampToEdgeWrapping,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three';

interface PenRealisticPreviewProps {
  designDataUrl: string;
  onCompositeReady?: (dataUrl: string) => void;
}

const DEFAULT_ROTATION_X = -0.18;
const DEFAULT_ROTATION_Y = 0.92;

function PenModel({ designTexture }: { designTexture: Texture | null }) {
  return (
    <group position={[0, 0.02, 0]} rotation={[0.16, 0, -0.52]} scale={1.12}>
      <mesh position={[-0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.31, 0.36, 5.9, 96, 1]} />
        <meshPhysicalMaterial
          color='#fbfbfa'
          roughness={0.2}
          metalness={0.02}
          clearcoat={0.7}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh
        position={[-0.62, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        visible={Boolean(designTexture)}
      >
        <cylinderGeometry args={[0.314, 0.364, 4.95, 96, 1, true]} />
        <meshStandardMaterial
          color='#ffffff'
          map={designTexture}
          transparent
          alphaTest={0.04}
          roughness={0.18}
          metalness={0.04}
        />
      </mesh>

      <mesh position={[-3.72, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.31, 0.9, 64, 1]} />
        <meshPhysicalMaterial
          color='#f4f4f3'
          roughness={0.22}
          metalness={0.03}
          clearcoat={0.5}
          clearcoatRoughness={0.22}
        />
      </mesh>

      <mesh position={[-4.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.32, 40, 1]} />
        <meshStandardMaterial
          color='#bcc4cf'
          roughness={0.24}
          metalness={0.92}
        />
      </mesh>

      <mesh position={[-4.38, 0, 0]} castShadow>
        <sphereGeometry args={[0.055, 28, 28]} />
        <meshStandardMaterial
          color='#9da7b3'
          roughness={0.16}
          metalness={1}
        />
      </mesh>

      <mesh position={[3.28, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 2.32, 96, 1]} />
        <meshPhysicalMaterial
          color='#fcfcfb'
          roughness={0.18}
          metalness={0.02}
          clearcoat={0.78}
          clearcoatRoughness={0.16}
        />
      </mesh>

      <mesh position={[2.08, 0.01, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.36, 0.012, 20, 72]} />
        <meshStandardMaterial color='#d7dce2' roughness={0.42} metalness={0.1} />
      </mesh>

      <mesh position={[4.55, 0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.52, 40, 1]} />
        <meshPhysicalMaterial
          color='#f3f4f6'
          roughness={0.22}
          metalness={0.04}
          clearcoat={0.55}
          clearcoatRoughness={0.2}
        />
      </mesh>

      <mesh position={[3.12, 0.45, 0.07]} castShadow>
        <boxGeometry args={[1.98, 0.12, 0.42]} />
        <meshPhysicalMaterial
          color='#fbfbfa'
          roughness={0.2}
          metalness={0.02}
          clearcoat={0.68}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh position={[2.22, 0.34, 0.08]} castShadow>
        <boxGeometry args={[0.32, 0.2, 0.28]} />
        <meshPhysicalMaterial
          color='#f0f2f4'
          roughness={0.24}
          metalness={0.05}
          clearcoat={0.4}
          clearcoatRoughness={0.24}
        />
      </mesh>

      <mesh position={[1.02, 0.16, 0.28]}>
        <boxGeometry args={[4.25, 0.02, 0.08]} />
        <meshStandardMaterial color='#ffffff' transparent opacity={0.52} />
      </mesh>

      <mesh position={[3.32, 0.18, 0.31]}>
        <boxGeometry args={[2.04, 0.016, 0.08]} />
        <meshStandardMaterial color='#ffffff' transparent opacity={0.48} />
      </mesh>
    </group>
  );
}

export default function PenRealisticPreview({
  designDataUrl,
  onCompositeReady,
}: PenRealisticPreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const textureRef = useRef<Texture | null>(null);
  const [rotationX, setRotationX] = useState(DEFAULT_ROTATION_X);
  const [rotationY, setRotationY] = useState(DEFAULT_ROTATION_Y);
  const [isDragging, setIsDragging] = useState(false);
  const [designTexture, setDesignTexture] = useState<Texture | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();

    loader.load(
      designDataUrl,
      texture => {
        if (cancelled) {
          texture.dispose();
          return;
        }

        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 8;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        texture.repeat.set(-1, 1);
        texture.offset.set(1, 0);
        texture.needsUpdate = true;

        setDesignTexture(previous => {
          previous?.dispose();
          textureRef.current = texture;
          return texture;
        });
        setTextureVersion(version => version + 1);
      },
      undefined,
      () => {
        if (!cancelled) {
          setDesignTexture(previous => {
            previous?.dispose();
            textureRef.current = null;
            return null;
          });
          setTextureVersion(version => version + 1);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [designDataUrl]);

  useEffect(
    () => () => {
      textureRef.current?.dispose();
      textureRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!onCompositeReady || textureVersion === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const canvas = stageRef.current?.querySelector('canvas');
      if (!canvas) {
        return;
      }

      try {
        onCompositeReady(canvas.toDataURL('image/png', 1));
      } catch (error) {
        console.error('[PenRealisticPreview] Snapshot export failed', error);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [onCompositeReady, rotationX, rotationY, textureVersion]);

  const handleExport = () => {
    const canvas = stageRef.current?.querySelector('canvas');
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', 1);
    link.download = 'ruchka-3d-korinishi.png';
    link.click();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragOriginRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - dragOriginRef.current.x;
    const deltaY = event.clientY - dragOriginRef.current.y;
    dragOriginRef.current = { x: event.clientX, y: event.clientY };

    setRotationX(previous => previous + deltaY * 0.01);
    setRotationY(previous => previous + deltaX * 0.012);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <div
        ref={stageRef}
        className='relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f6f8fb_48%,_#e2e8f0_100%)] shadow-inner shadow-white/60'
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className='absolute left-4 top-4 z-10 flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={handleExport}
            onPointerDown={event => event.stopPropagation()}
            className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/70 transition-colors hover:bg-white'
          >
            <Camera className='h-4 w-4' />
            PNG
          </button>
          <button
            type='button'
            onClick={() => {
              setRotationX(DEFAULT_ROTATION_X);
              setRotationY(DEFAULT_ROTATION_Y);
            }}
            onPointerDown={event => event.stopPropagation()}
            className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/70 transition-colors hover:bg-white'
          >
            <RotateCcw className='h-4 w-4' />
            Reset
          </button>
        </div>

        <div className='absolute bottom-4 left-4 z-10 max-w-[18rem] rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-left shadow-lg shadow-slate-200/70 backdrop-blur'>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-700'>
            3D / 360 preview
          </p>
          <p className='mt-1 text-sm leading-5 text-slate-600'>
            Gorizontal suring `Y`, vertikal suring `X` o&apos;qida aylansin.
            Dizayn barrel bo&apos;ylab to&apos;liq o&apos;ralgan holda ko&apos;rinadi.
          </p>
        </div>

        <Canvas
          camera={{ position: [0, 0.95, 10.6], fov: 33 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          style={{ width: '100%', height: '100%' }}
          shadows
        >
          <color attach='background' args={['#eef2f7']} />
          <ambientLight intensity={1.55} />
          <directionalLight
            position={[6, 7, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-5, 3, -4]} intensity={0.6} />
          <pointLight position={[0, 2, 6]} intensity={0.45} />

          <Suspense fallback={null}>
            <group rotation={[rotationX, rotationY, 0]}>
              <PenModel designTexture={designTexture} />
            </group>
          </Suspense>

          <ContactShadows
            position={[0, -1.55, 0]}
            opacity={0.28}
            scale={10}
            blur={2.6}
            far={4.5}
            color='#94a3b8'
          />
        </Canvas>
      </div>
    </div>
  );
}
