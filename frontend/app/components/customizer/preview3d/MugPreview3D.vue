<script setup lang="ts">
import * as THREE from 'three';

// Procedural mug geometry ported 1:1 from the previous frontend's
// `MugViewer.tsx` (react-three-fiber) to vanilla Three.js — same
// dimensions, same partial-wrap decal band, same drag-to-rotate feel.
const props = defineProps<{
  textureDataUrl: string | null;
  mugColor: string;
}>();

const MUG_PRINT_GAP_RATIO = 0.0667; // matches MUG_HANDLE_MARGIN_PX*2 / MUG_EDITOR_CANVAS_WIDTH
const MUG_PRINT_COVERAGE = 1 - MUG_PRINT_GAP_RATIO;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let group: THREE.Group | null = null;
let decalMaterial: THREE.MeshStandardMaterial | null = null;
let baseMaterial: THREE.MeshStandardMaterial | null = null;
let innerMaterial: THREE.MeshStandardMaterial | null = null;
let rafId = 0;
let disposed = false;

let isDragging = false;
let lastX = 0;
let rotationY = 0;

function onPointerDown(event: PointerEvent) {
  isDragging = true;
  lastX = event.clientX
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId);
}
function onPointerMove(event: PointerEvent) {
  if (!isDragging || !group) return;
  const dx = event.clientX - lastX;
  lastX = event.clientX;
  rotationY += dx * 0.01;
  group.rotation.y = rotationY;
}
function onPointerUp() {
  isDragging = false;
}

function resize() {
  const el = containerRef.value;
  if (!el || !renderer || !camera) return;
  const { clientWidth: w, clientHeight: h } = el;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function applyTexture(dataUrl: string | null) {
  if (!decalMaterial) return;
  if (!dataUrl) {
    decalMaterial.map = null;
    decalMaterial.needsUpdate = true;
    return;
  }
  new THREE.TextureLoader().load(dataUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    // The decal geometry (see `decalGeo` below) is already a *partial*
    // cylinder — its own thetaStart/thetaLength leave out the angular band
    // behind the handle, so nothing is drawn there regardless of the
    // texture. The full exported canvas (the flat "Bosma hududi" editor,
    // margins included) should therefore map straight across that partial
    // band with no further cropping: canvas x=0 (its left edge) lands at
    // decal U=0 (thetaStart, immediately past the handle), and canvas
    // x=width (its right edge) lands at decal U=1 (thetaStart+thetaLength,
    // immediately before the handle on the other side) — the flat card IS
    // the mug's printable surface, edge to edge.
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.offset.set(0, 0);
    tex.repeat.set(1, 1);
    decalMaterial!.map?.dispose();
    decalMaterial!.map = tex;
    decalMaterial!.needsUpdate = true;
  });
}

function applyColor(hex: string) {
  baseMaterial?.color.set(hex);
  innerMaterial?.color.set(hex);
}

function buildMug() {
  const radius = 2;
  const height = 4;
  const radialSegments = 64;

  const baseGeo = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
  const innerRadius = radius * 0.95;
  const innerGeo = new THREE.CylinderGeometry(innerRadius, radius * 0.999, height + 0.01, radialSegments);
  const bottomGeo = new THREE.CircleGeometry(innerRadius, radialSegments);
  const handleGeo = new THREE.TorusGeometry(1.2, 0.3, 16, 32);

  const thetaStart = Math.PI * 0.5 + Math.PI * MUG_PRINT_GAP_RATIO;
  const thetaLength = Math.PI * 2 * MUG_PRINT_COVERAGE;
  const decalGeo = new THREE.CylinderGeometry(
    radius + 0.002,
    radius + 0.002,
    height - 0.2,
    radialSegments,
    1,
    true,
    thetaStart,
    thetaLength,
  );

  baseMaterial = new THREE.MeshStandardMaterial({ color: props.mugColor, roughness: 0.15, metalness: 0.1 });
  innerMaterial = new THREE.MeshStandardMaterial({ color: props.mugColor, roughness: 0.15, metalness: 0.1, side: THREE.BackSide });
  // toneMapped: false — tone mapping/exposure here is tuned for the mug
  // body's PBR shading; applied to the decal it washes out the design's
  // real colors (see the matching note in GarmentEditorModel3D.vue).
  decalMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, roughness: 0.15, metalness: 0.1, toneMapped: false });

  const g = new THREE.Group();
  g.add(new THREE.Mesh(baseGeo, baseMaterial));
  g.add(new THREE.Mesh(innerGeo, innerMaterial));
  const bottom = new THREE.Mesh(bottomGeo, baseMaterial);
  bottom.position.set(0, -height / 2 + 0.1, 0);
  bottom.rotation.set(-Math.PI / 2, 0, 0);
  g.add(bottom);
  const handle = new THREE.Mesh(handleGeo, baseMaterial);
  handle.position.set(radius + 0.6, 0.2, 0);
  g.add(handle);
  g.add(new THREE.Mesh(decalGeo, decalMaterial));

  return g;
}

function init() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#f1efec');

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.4, 8.5);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  resize();

  // Matches GarmentEditorModel3D's light levels so white renders the same
  // shade of white across every product, not a visibly grayer mug.
  scene.add(new THREE.AmbientLight(0xffffff, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(5, 5, 5);
  scene.add(key);
  const fill = new THREE.PointLight(0xffffff, 0.6);
  fill.position.set(-5, 3, -5);
  scene.add(fill);

  group = new THREE.Group();
  group.scale.setScalar(0.8);
  group.add(buildMug());
  scene.add(group);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 64),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.12, depthWrite: false }),
  );
  shadow.position.set(0, -1.82, 0);
  shadow.rotation.set(-Math.PI / 2, 0, 0);
  scene.add(shadow);

  applyTexture(props.textureDataUrl);
  renderLoop();
}

function renderLoop() {
  if (disposed) return;
  rafId = requestAnimationFrame(renderLoop);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

watch(() => props.textureDataUrl, applyTexture);
watch(() => props.mugColor, applyColor);

defineExpose({ updateTexture: applyTexture });

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  init();
  resizeObserver = new ResizeObserver(resize);
  if (containerRef.value) resizeObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  scene?.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.dispose?.();
    }
  });
  renderer?.dispose();
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full cursor-grab active:cursor-grabbing"
  >
    <canvas
      ref="canvasRef"
      class="h-full w-full touch-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    />
    <p class="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-white">
      <Icon
        name="lucide:rotate-3d"
        class="h-3.5 w-3.5"
      /> Aylantirish uchun torting
    </p>
  </div>
</template>
