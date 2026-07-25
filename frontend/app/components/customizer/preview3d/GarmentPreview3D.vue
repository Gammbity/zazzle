<script setup lang="ts">
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { GarmentType } from '~/types/garment';
import { loadGLTFCached } from '~/composables/useGLTFCache';

const props = defineProps<{
  garment: GarmentType;
  frontDataUrl: string | null;
  backDataUrl: string | null;
  shirtColor: string;
  // Same rectangles (percent of stage) used to position the editor's
  // interactive canvas for each side — anchoring the decals to these via a
  // camera raycast keeps the preview's design placement consistent with
  // what was actually edited, instead of an independent height heuristic.
  frontPrintArea: { top: number; left: number; width: number; height: number };
  backPrintArea: { top: number; left: number; width: number; height: number } | null;
}>();

const MODEL_URLS: Record<GarmentType, string> = {
  't-shirt': '/models/standard-t-shirt.glb',
  'hoodie': '/models/hoodie-v3.glb',
};

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(true);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let modelGroup: THREE.Group | null = null;
let rafId = 0;
let disposed = false;

const textureLoader = new THREE.TextureLoader();
let frontDecalMesh: THREE.Mesh | null = null;
let backDecalMesh: THREE.Mesh | null = null;

// Drag-to-rotate (Y axis) — same interaction model as the mug viewer.
let isDragging = false;
let lastX = 0;
let rotationY = 0;

function onPointerDown(event: PointerEvent) {
  isDragging = true;
  lastX = event.clientX
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId);
}
function onPointerMove(event: PointerEvent) {
  if (!isDragging || !modelGroup) return;
  const dx = event.clientX - lastX;
  lastX = event.clientX;
  rotationY += dx * 0.01;
  modelGroup.rotation.y = rotationY;
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

type PrintAreaRect = { top: number; left: number; width: number; height: number };

// Casts a ray through a virtual camera positioned/oriented to look at the
// requested side of the model (the real camera for front, a Z-mirrored one
// for back — the model itself never rotates during setup, both decals are
// built once and simply ride along with modelGroup's rotation afterward),
// through the screen point where the given printArea rectangle is centered.
// This keeps the preview's design placement anchored to the exact same
// rectangle the editor's interactive canvas uses for that side.
function raycastPrintArea(root: THREE.Object3D, cam: THREE.PerspectiveCamera, pa: PrintAreaRect): { mesh: THREE.Mesh; point: THREE.Vector3; normal: THREE.Vector3 } | null {
  // Runs before the first render pass, so matrixWorld needs a manual
  // refresh — see the matching note in GarmentEditorModel3D.vue.
  cam.updateMatrixWorld(true);
  root.updateMatrixWorld(true);
  const ndcX = ((pa.left + pa.width / 2) / 100) * 2 - 1;
  const ndcY = -(((pa.top + pa.height / 2) / 100) * 2 - 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
  const hit = raycaster.intersectObject(root, true)[0];
  if (!hit || !hit.face) return null;
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  return { mesh: hit.object as THREE.Mesh, point: hit.point, normal };
}

function worldSizeForPrintArea(cam: THREE.PerspectiveCamera, point: THREE.Vector3, pa: PrintAreaRect): { width: number; height: number } {
  const dist = cam.position.distanceTo(point);
  const vFov = (cam.fov * Math.PI) / 180;
  const worldHeightAtDist = 2 * Math.tan(vFov / 2) * dist;
  const worldWidthAtDist = worldHeightAtDist * cam.aspect;
  return {
    width: worldWidthAtDist * (pa.width / 100),
    height: worldHeightAtDist * (pa.height / 100),
  };
}

function buildDecal(mesh: THREE.Mesh, anchor: { point: THREE.Vector3; normal: THREE.Vector3 }, size: { width: number; height: number }): THREE.Mesh {
  const orientation = new THREE.Euler();
  const lookTarget = anchor.point.clone().add(anchor.normal);
  const dummy = new THREE.Object3D();
  dummy.position.copy(anchor.point);
  dummy.lookAt(lookTarget);
  orientation.copy(dummy.rotation);

  const depth = Math.max(size.width, size.height) * 0.7;
  const geometry = new DecalGeometry(mesh, anchor.point, orientation, new THREE.Vector3(size.width, size.height, depth));
  const material = new THREE.MeshBasicMaterial({
    map: null,
    transparent: true,
    // Tone mapping is tuned for the garment fabric's PBR shading — applied
    // to the decal too, it washes out the uploaded design's real colors.
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    // See the matching note in GarmentEditorModel3D.vue — the back decal
    // uses a Z-mirrored virtual camera, which can flip DecalGeometry's
    // face winding and make it invisible under the default FrontSide.
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

function applyTexture(mesh: THREE.Mesh | null, dataUrl: string | null, isBack: boolean) {
  if (!mesh) return;
  const material = mesh.material as THREE.MeshBasicMaterial;
  if (!dataUrl) {
    material.map = null;
    material.needsUpdate = true;
    return;
  }
  textureLoader.load(dataUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    // The back decal is built via a Z-mirrored virtual camera rather than
    // an actual model rotation — that mirrors DecalGeometry's UV basis the
    // same way the editor's rotated-mesh approach does, so text/designs
    // need the same horizontal un-flip to read normally.
    if (isBack) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
    }
    material.map?.dispose();
    material.map = tex;
    material.needsUpdate = true;
  });
}

async function init() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#f1efec');

  camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.01, 100);
  camera.position.set(0, 0.1, 3.4);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  resize();

  scene.add(new THREE.AmbientLight(0xffffff, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-3, 1, -2);
  scene.add(fill);
  // Co-located with the (fixed) camera — the model rotates, not the
  // camera, so this keeps whichever face is toward the viewer well-lit
  // instead of relying on angled key/fill lights alone.
  const headlight = new THREE.DirectionalLight(0xffffff, 0.8);
  headlight.position.set(0, 0.1, 3.4);
  scene.add(headlight);

  const gltf = await loadGLTFCached(MODEL_URLS[props.garment]);
  if (disposed) return;
  const model = gltf.scene.clone(true);

  // Scale FIRST, then measure/recenter — see the note in
  // GarmentEditorModel3D.vue for why the order matters.
  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);
  model.scale.setScalar(2.2 / Math.max(rawSize.x, rawSize.y, rawSize.z));

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  model.position.sub(scaledCenter);

  modelGroup = new THREE.Group();
  modelGroup.add(model);
  scene.add(modelGroup);

  // The source .glb splits the garment shell across several mesh nodes
  // (an exporter-side chunking artifact, not duplicate/overlapping
  // geometry — each one covers a different region), so all of them stay
  // visible; each material is cloned so it doesn't mutate the shared
  // cached asset.
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const material = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
      // See the matching note in GarmentEditorModel3D.vue — some source
      // models bake shading into baseColor/emissive maps, which would
      // otherwise stay dark no matter what garment color is selected.
      material.map?.dispose();
      material.map = null;
      material.emissiveMap?.dispose();
      material.emissiveMap = null;
      material.emissive.set(0x000000);
      material.transparent = false;
      material.opacity = 1;
      // Keeps "white" the same shade across garments regardless of each
      // source .glb's baked roughness/metalness — see the matching note
      // in GarmentEditorModel3D.vue.
      material.roughness = 0.85;
      material.metalness = 0;
      material.color.set(props.shirtColor);
      mesh.material = material;
      mesh.geometry.computeVertexNormals();
    }
  });

  const frontAnchor = raycastPrintArea(modelGroup, camera, props.frontPrintArea);
  if (frontAnchor) {
    const size = worldSizeForPrintArea(camera, frontAnchor.point, props.frontPrintArea);
    frontDecalMesh = buildDecal(frontAnchor.mesh, frontAnchor, size);
    modelGroup.add(frontDecalMesh);
    applyTexture(frontDecalMesh, props.frontDataUrl, false);
  }

  if (props.backPrintArea) {
    // Mirrors the real camera to the opposite side (same distance/FOV,
    // looking back the other way) rather than rotating the model — the
    // model stays at rotation 0 throughout setup, so both decals bake
    // correctly relative to modelGroup and simply ride along with it once
    // the user starts dragging to rotate.
    const backCamera = camera.clone();
    backCamera.position.set(camera.position.x, camera.position.y, -camera.position.z);
    backCamera.lookAt(0, camera.position.y, 0);
    backCamera.updateMatrixWorld(true);
    const backAnchor = raycastPrintArea(modelGroup, backCamera, props.backPrintArea);
    if (backAnchor && props.backDataUrl) {
      const size = worldSizeForPrintArea(backCamera, backAnchor.point, props.backPrintArea);
      backDecalMesh = buildDecal(backAnchor.mesh, backAnchor, size);
      modelGroup.add(backDecalMesh);
      applyTexture(backDecalMesh, props.backDataUrl, true);
    }
  }

  loading.value = false;
  renderLoop();
}

function renderLoop() {
  if (disposed) return;
  rafId = requestAnimationFrame(renderLoop);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

watch(() => props.frontDataUrl, val => applyTexture(frontDecalMesh, val, false));
watch(() => props.backDataUrl, val => applyTexture(backDecalMesh, val, true));

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  void init();
  resizeObserver = new ResizeObserver(resize);
  if (containerRef.value) resizeObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  frontDecalMesh?.geometry.dispose();
  backDecalMesh?.geometry.dispose();
  scene?.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[];
      const mats = Array.isArray(mat) ? mat : [mat];
      mats.forEach((m) => {
        const stdMat = m as THREE.MeshStandardMaterial;
        stdMat.map?.dispose();
        m.dispose();
      });
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
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-brand-surface-low"
    >
      <Icon
        name="lucide:loader-2"
        class="h-8 w-8 animate-spin text-secondary-600"
      />
    </div>
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
