import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Camera } from 'lucide-react';
import {
  DataTexture,
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type GarmentType = 't-shirt' | 'hoodie';

interface GarmentModelConfig {
  modelUrl: string;
  scale: number;
  modelOffset: [number, number, number];
  frontDecalPosition: [number, number, number];
  backDecalPosition: [number, number, number];
  decalSize: [number, number, number];
  shadowY: number;
  shadowRadius: number;
  attribution?: {
    label: string;
    url: string;
  };
}

const GARMENT_MODELS: Record<GarmentType, GarmentModelConfig> = {
  't-shirt': {
    modelUrl: '/models/t-shirt.glb',
    scale: 5.25,
    modelOffset: [0, 0, 0],
    frontDecalPosition: [0, 0.015, 0.176],
    backDecalPosition: [0, 0.015, -0.176],
    decalSize: [0.37, 0.47, 0.075],
    shadowY: -2.62,
    shadowRadius: 2.15,
  },
  hoodie: {
    modelUrl: '/models/hoodie.glb',
    scale: 6.1,
    modelOffset: [0, -1.3588, 0],
    frontDecalPosition: [0, 0.015, 0.18],
    backDecalPosition: [0, 0.015, -0.14],
    decalSize: [0.34, 0.35, 0.06],
    shadowY: -2.5,
    shadowRadius: 2.55,
    attribution: {
      label: '3D model: yogaminggames · CC BY 4.0',
      url: 'https://sketchfab.com/3d-models/hoodie-2c674228f1e946b5b8f508f8f818e130',
    },
  },
};

interface TshirtViewerProps {
  frontTextureUrl: string;
  backTextureUrl: string;
  shirtColor: string;
  viewSide: 'front' | 'back';
  garment?: GarmentType;
}

interface TshirtModelProps {
  frontTextureUrl: string;
  backTextureUrl: string;
  shirtColor: string;
  rotationY: number;
  config: GarmentModelConfig;
}

function createClothTexture(): DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const weaveX = x % 4 < 2 ? 12 : -7;
      const weaveY = y % 4 < 2 ? 9 : -5;
      const noise = ((x * 17 + y * 29 + x * y * 3) % 11) - 5;
      const value = 128 + weaveX + weaveY + noise;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(22, 26);
  texture.needsUpdate = true;
  return texture;
}

function useDesignTexture(url: string): Texture | null {
  const [loaded, setLoaded] = useState<{
    url: string;
    texture: Texture;
  } | null>(null);

  useEffect(() => {
    if (!url) return;

    let disposed = false;
    new TextureLoader().load(url, texture => {
      if (disposed) {
        texture.dispose();
        return;
      }

      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      setLoaded(previous => {
        previous?.texture.dispose();
        return { url, texture };
      });
    });

    return () => {
      disposed = true;
    };
  }, [url]);

  useEffect(
    () => () => {
      loaded?.texture.dispose();
    },
    [loaded]
  );

  return loaded?.url === url ? loaded.texture : null;
}

function getGarmentMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  root.traverse(child => {
    if (child instanceof Mesh) meshes.push(child);
  });
  return meshes;
}

function createPrintDecals(
  root: Object3D,
  side: 'front' | 'back',
  config: GarmentModelConfig
) {
  root.updateMatrixWorld(true);

  const isFront = side === 'front';
  const position = new Vector3(
    ...(isFront ? config.frontDecalPosition : config.backDecalPosition)
  );
  const orientation = new Euler(0, isFront ? 0 : Math.PI, 0);
  const size = new Vector3(...config.decalSize);

  return getGarmentMeshes(root)
    .map(mesh => new DecalGeometry(mesh, position, orientation, size))
    .filter(geometry => geometry.attributes.position.count > 0);
}

function RealTshirt({
  frontTextureUrl,
  backTextureUrl,
  shirtColor,
  rotationY,
  config,
}: TshirtModelProps) {
  const { scene } = useLoader(GLTFLoader, config.modelUrl);
  const frontTexture = useDesignTexture(frontTextureUrl);
  const backTexture = useDesignTexture(backTextureUrl);
  const clothTexture = useMemo(() => createClothTexture(), []);
  const shirtMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: shirtColor,
        roughness: 0.9,
        metalness: 0,
        side: DoubleSide,
        bumpMap: clothTexture,
        bumpScale: 0.004,
      }),
    [clothTexture, shirtColor]
  );
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.position.set(...config.modelOffset);
    getGarmentMeshes(clone).forEach(mesh => {
      mesh.material = shirtMaterial;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    clone.updateMatrixWorld(true);
    return clone;
  }, [config, scene, shirtMaterial]);
  const frontDecals = useMemo(
    () => createPrintDecals(model, 'front', config),
    [config, model]
  );
  const backDecals = useMemo(
    () => createPrintDecals(model, 'back', config),
    [config, model]
  );

  useEffect(
    () => () => {
      clothTexture.dispose();
    },
    [clothTexture]
  );

  useEffect(
    () => () => {
      shirtMaterial.dispose();
    },
    [shirtMaterial]
  );

  useEffect(
    () => () => {
      frontDecals.forEach(geometry => geometry.dispose());
      backDecals.forEach(geometry => geometry.dispose());
    },
    [backDecals, frontDecals]
  );

  return (
    <group rotation={[0, rotationY, 0]} scale={config.scale}>
      <primitive object={model} />

      {frontTexture
        ? frontDecals.map((geometry, index) => (
            <mesh key={`front-${index}`} geometry={geometry} renderOrder={2}>
              <meshStandardMaterial
                map={frontTexture}
                transparent
                roughness={0.86}
                metalness={0}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-4}
              />
            </mesh>
          ))
        : null}

      {backTexture
        ? backDecals.map((geometry, index) => (
            <mesh key={`back-${index}`} geometry={geometry} renderOrder={2}>
              <meshStandardMaterial
                map={backTexture}
                transparent
                roughness={0.86}
                metalness={0}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-4}
              />
            </mesh>
          ))
        : null}
    </group>
  );
}

useLoader.preload(GLTFLoader, GARMENT_MODELS['t-shirt'].modelUrl);
useLoader.preload(GLTFLoader, GARMENT_MODELS.hoodie.modelUrl);

export default function TshirtViewer({
  frontTextureUrl,
  backTextureUrl,
  shirtColor,
  viewSide,
  garment = 't-shirt',
}: TshirtViewerProps) {
  const config = GARMENT_MODELS[garment];
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRotation = viewSide === 'front' ? 0 : Math.PI;
  const [rotationState, setRotationState] = useState({
    side: viewSide,
    value: baseRotation,
  });
  const rotationY =
    rotationState.side === viewSide ? rotationState.value : baseRotation;
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);

  const handleExport = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${garment}-${viewSide}-3d.png`;
    link.href = canvas.toDataURL('image/png', 1);
    link.click();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    lastX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = event.clientX - lastX.current;
    lastX.current = event.clientX;
    setRotationState(previous => ({
      side: viewSide,
      value:
        (previous.side === viewSide ? previous.value : baseRotation) +
        delta * 0.012,
    }));
  };

  const stopDragging = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className='canvas-wrapper'
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={stopDragging}
    >
      <button
        type='button'
        className='action-btn primary'
        onClick={handleExport}
        onPointerDown={event => event.stopPropagation()}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          width: 'auto',
        }}
      >
        <Camera size={18} /> Eksport
      </button>

      {config.attribution ? (
        <a
          className='model-attribution'
          href={config.attribution.url}
          target='_blank'
          rel='noreferrer'
          onPointerDown={event => event.stopPropagation()}
        >
          {config.attribution.label}
        </a>
      ) : null}

      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 46 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <color attach='background' args={['#cbd5e1']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 7]} intensity={2.2} castShadow />
        <directionalLight position={[-5, 2, 2]} intensity={0.65} />
        <pointLight position={[0, -3, 5]} intensity={0.3} />

        <Suspense fallback={null}>
          <RealTshirt
            frontTextureUrl={frontTextureUrl}
            backTextureUrl={backTextureUrl}
            shirtColor={shirtColor}
            rotationY={rotationY}
            config={config}
          />
        </Suspense>

        <mesh
          position={[0, config.shadowY, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[config.shadowRadius, 64]} />
          <meshBasicMaterial
            color='#000000'
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>
      </Canvas>
    </div>
  );
}
