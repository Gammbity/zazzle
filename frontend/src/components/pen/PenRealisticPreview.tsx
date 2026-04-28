import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import {
  ClampToEdgeWrapping,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type Group,
} from 'three';
import { PEN_PRINT_COVERAGE } from '@/components/customizer/penPrintConstants';

interface PenRealisticPreviewProps {
  designDataUrl: string;
  bodyColor?: string;
  onCompositeReady?: (dataUrl: string) => void;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const DEFAULT_ROTATION_X_DEG = -10;
const DEFAULT_ROTATION_Y_DEG = 53;
const ROTATION_X_MIN_DEG = -100;
const ROTATION_X_MAX_DEG = 100;
const ROTATION_Y_MIN_DEG = -180;
const ROTATION_Y_MAX_DEG = 180;
const PEN_BODY_LENGTH = 5.9;
const PEN_PRINT_SLEEVE_LENGTH = PEN_BODY_LENGTH * PEN_PRINT_COVERAGE;
const DRAG_SENSITIVITY_X = 0.0065;
const DRAG_SENSITIVITY_Y = 0.009;
const ROTATION_DAMPING = 12;

function clampRotation(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSliderStyle(value: number, min: number, max: number) {
  const progress = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${progress}%, #cbd5e1 ${progress}%, #cbd5e1 100%)`,
  };
}

function PenModel({
  designTexture,
  bodyColor = '#fbfbfa',
}: {
  designTexture: Texture | null;
  bodyColor?: string;
}) {
  return (
    <group
      position={[-0.04, -0.03, 0]}
      rotation={[0.16, 0, -0.52]}
      scale={0.92}
    >
      <mesh position={[-0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.31, 0.36, 5.9, 96, 1]} />
        <meshPhysicalMaterial
          color={bodyColor}
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
        <cylinderGeometry
          args={[0.314, 0.364, PEN_PRINT_SLEEVE_LENGTH, 96, 1, true]}
        />
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
          color={bodyColor}
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
        <meshStandardMaterial color='#9da7b3' roughness={0.16} metalness={1} />
      </mesh>

      <mesh
        position={[3.28, 0.02, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.36, 2.32, 96, 1]} />
        <meshPhysicalMaterial
          color={bodyColor}
          roughness={0.18}
          metalness={0.02}
          clearcoat={0.78}
          clearcoatRoughness={0.16}
        />
      </mesh>

      <mesh
        position={[2.08, 0.01, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      >
        <torusGeometry args={[0.36, 0.012, 20, 72]} />
        <meshStandardMaterial
          color='#d7dce2'
          roughness={0.42}
          metalness={0.1}
        />
      </mesh>

      <mesh
        position={[4.55, 0.14, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.17, 0.17, 0.52, 40, 1]} />
        <meshPhysicalMaterial
          color={bodyColor}
          roughness={0.22}
          metalness={0.04}
          clearcoat={0.55}
          clearcoatRoughness={0.2}
        />
      </mesh>

      <mesh position={[3.12, 0.45, 0.07]} castShadow>
        <boxGeometry args={[1.98, 0.12, 0.42]} />
        <meshPhysicalMaterial
          color={bodyColor}
          roughness={0.2}
          metalness={0.02}
          clearcoat={0.68}
          clearcoatRoughness={0.18}
        />
      </mesh>

      <mesh position={[2.22, 0.34, 0.08]} castShadow>
        <boxGeometry args={[0.32, 0.2, 0.28]} />
        <meshPhysicalMaterial
          color={bodyColor}
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

function SmoothPenModel({
  designTexture,
  bodyColor,
  rotationXDeg,
  rotationYDeg,
}: {
  designTexture: Texture | null;
  bodyColor?: string;
  rotationXDeg: number;
  rotationYDeg: number;
}) {
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    groupRef.current?.rotation.set(
      DEFAULT_ROTATION_X_DEG * DEG_TO_RAD,
      DEFAULT_ROTATION_Y_DEG * DEG_TO_RAD,
      0
    );
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    group.rotation.x = MathUtils.damp(
      group.rotation.x,
      rotationXDeg * DEG_TO_RAD,
      ROTATION_DAMPING,
      delta
    );
    group.rotation.y = MathUtils.damp(
      group.rotation.y,
      rotationYDeg * DEG_TO_RAD,
      ROTATION_DAMPING,
      delta
    );
  });

  return (
    <group ref={groupRef}>
      <PenModel designTexture={designTexture} bodyColor={bodyColor} />
    </group>
  );
}

export default function PenRealisticPreview({
  designDataUrl,
  bodyColor,
  onCompositeReady,
}: PenRealisticPreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const textureRef = useRef<Texture | null>(null);
  const [rotationXDeg, setRotationXDeg] = useState(DEFAULT_ROTATION_X_DEG);
  const [rotationYDeg, setRotationYDeg] = useState(DEFAULT_ROTATION_Y_DEG);
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
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = RepeatWrapping;
        texture.center.set(0.5, 0.5);
        texture.rotation = Math.PI / 2;
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
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
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [onCompositeReady, rotationXDeg, rotationYDeg, textureVersion]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

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

    setRotationXDeg(previous =>
      clampRotation(
        previous + deltaY * DRAG_SENSITIVITY_X * RAD_TO_DEG,
        ROTATION_X_MIN_DEG,
        ROTATION_X_MAX_DEG
      )
    );
    setRotationYDeg(previous =>
      clampRotation(
        previous + deltaX * DRAG_SENSITIVITY_Y * RAD_TO_DEG,
        ROTATION_Y_MIN_DEG,
        ROTATION_Y_MAX_DEG
      )
    );
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
        className={`relative aspect-[16/10] w-full touch-none overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f6f8fb_48%,_#e2e8f0_100%)] shadow-inner shadow-white/60 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        aria-label="Ruchka ko'rinishi"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          camera={{ position: [0, 1, 13.4], fov: 37 }}
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
            <SmoothPenModel
              designTexture={designTexture}
              bodyColor={bodyColor}
              rotationXDeg={rotationXDeg}
              rotationYDeg={rotationYDeg}
            />
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

      <div
        className='grid gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 sm:grid-cols-2'
        aria-label='Ruchka gradusini boshqarish'
      >
        <label className='flex flex-col gap-1.5 text-xs font-medium text-slate-600'>
          <span className='flex items-center justify-between gap-3'>
            <span>Vertikal</span>
            <span className='tabular-nums text-slate-500'>
              {Math.round(rotationXDeg)}&deg;
            </span>
          </span>
          <input
            type='range'
            min={ROTATION_X_MIN_DEG}
            max={ROTATION_X_MAX_DEG}
            step={1}
            value={rotationXDeg}
            onChange={event => setRotationXDeg(Number(event.target.value))}
            aria-label='Ruchka vertikal gradusi'
            className='h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-violet-300 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-violet-600 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-violet-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm'
            style={getSliderStyle(
              rotationXDeg,
              ROTATION_X_MIN_DEG,
              ROTATION_X_MAX_DEG
            )}
          />
        </label>
        <label className='flex flex-col gap-1.5 text-xs font-medium text-slate-600'>
          <span className='flex items-center justify-between gap-3'>
            <span>Gorizontal</span>
            <span className='tabular-nums text-slate-500'>
              {Math.round(rotationYDeg)}&deg;
            </span>
          </span>
          <input
            type='range'
            min={ROTATION_Y_MIN_DEG}
            max={ROTATION_Y_MAX_DEG}
            step={1}
            value={rotationYDeg}
            onChange={event => setRotationYDeg(Number(event.target.value))}
            aria-label='Ruchka gorizontal gradusi'
            className='h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-violet-300 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-violet-600 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-violet-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm'
            style={getSliderStyle(
              rotationYDeg,
              ROTATION_Y_MIN_DEG,
              ROTATION_Y_MAX_DEG
            )}
          />
        </label>
      </div>
    </div>
  );
}
