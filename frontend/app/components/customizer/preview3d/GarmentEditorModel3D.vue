<script setup lang="ts">
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { GarmentSide, GarmentType } from '~/types/garment';
import { loadGLTFCached } from '~/composables/useGLTFCache';

// Same 3D model as the Preview modal, but fixed in place — no drag-to-
// rotate. Front/back is a hard camera-side switch (via `viewSide`), not a
// spin, and the garment color is a live material tint. This is the editing
// backdrop: the fabric.js canvas (positioned by the parent) sits on top of
// it and drives `updateTexture()` on every design change.
const props = defineProps<{
  garment: GarmentType;
  viewSide: GarmentSide;
  shirtColor: string;
  // Same rectangle (percent of the stage frame) that positions the
  // invisible fabric.js editing canvas on top of this component — the
  // decal is anchored via a camera raycast through its center so the
  // design the user sees on the 3D surface and the interactive
  // drag/resize handles from that canvas always line up exactly, instead
  // of relying on two independently-tuned positioning systems.
  printArea: { top: number; left: number; width: number; height: number };
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
let allMeshes: THREE.Mesh[] = [];
let decalMesh: THREE.Mesh | null = null;
let rafId = 0;
let disposed = false;
let pendingTexture: string | null = null;

const textureLoader = new THREE.TextureLoader();

function resize() {
  const el = containerRef.value;
  if (!el || !renderer || !camera) return;
  const { clientWidth: w, clientHeight: h } = el;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // The decal's screen-space anchor depends on the camera's aspect ratio,
  // so any resize (e.g. the container growing/shrinking) needs a rebuild
  // to stay aligned with the editing canvas.
  if (modelGroup) buildDecalAt(modelGroup);
}

function raycastPrintArea(root: THREE.Object3D): { mesh: THREE.Mesh; point: THREE.Vector3; normal: THREE.Vector3 } | null {
  if (!camera) return null;
  // Both matrices need a manual refresh here — this raycast can run before
  // the first render pass (e.g. during initial setup, or right after
  // toggling `modelGroup.rotation.y` for a side switch), and Object3D only
  // recomputes `matrixWorld` automatically as part of a render traversal.
  // Without this, `setFromCamera` builds the ray from a stale (identity)
  // camera transform and the raycast misses the model entirely.
  camera.updateMatrixWorld(true);
  root.updateMatrixWorld(true);
  const pa = props.printArea;
  const ndcX = ((pa.left + pa.width / 2) / 100) * 2 - 1;
  const ndcY = -(((pa.top + pa.height / 2) / 100) * 2 - 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const hit = raycaster.intersectObject(root, true)[0];
  if (!hit || !hit.face) return null;
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  return { mesh: hit.object as THREE.Mesh, point: hit.point, normal };
}

// Converts the printArea's percentage width/height into world units at the
// hit point's depth, using the camera's vertical FOV — this is what makes
// the decal's on-screen size match the editing canvas's on-screen size
// exactly, regardless of how far the surface point happens to be from the
// camera at that spot on the garment.
function worldSizeForPrintArea(point: THREE.Vector3): { width: number; height: number } {
  if (!camera) return { width: 1, height: 1 };
  const dist = camera.position.distanceTo(point);
  const vFov = (camera.fov * Math.PI) / 180;
  const worldHeightAtDist = 2 * Math.tan(vFov / 2) * dist;
  const worldWidthAtDist = worldHeightAtDist * camera.aspect;
  return {
    width: worldWidthAtDist * (props.printArea.width / 100),
    height: worldHeightAtDist * (props.printArea.height / 100),
  };
}

function buildDecalAt(root: THREE.Object3D) {
  decalMesh?.geometry.dispose();
  if (decalMesh) modelGroup?.remove(decalMesh);
  decalMesh = null;

  const anchor = raycastPrintArea(root);
  if (!anchor) return;

  const size = worldSizeForPrintArea(anchor.point);
  const depth = Math.max(size.width, size.height) * 0.7;

  const dummy = new THREE.Object3D();
  dummy.position.copy(anchor.point);
  dummy.lookAt(anchor.point.clone().add(anchor.normal));

  const geometry = new DecalGeometry(anchor.mesh, anchor.point, dummy.rotation.clone(), new THREE.Vector3(size.width, size.height, depth));
  const material = new THREE.MeshBasicMaterial({
    map: null,
    transparent: true,
    // ACESFilmicToneMapping + the boosted exposure below are tuned so the
    // *garment fabric* renders true white instead of PBR-gray — applied to
    // the decal too (three.js tone-maps every material by default), it
    // washes out the uploaded design's actual colors. The decal should
    // reproduce the source image exactly, so it opts out.
    toneMapped: false,
    // With depthTest enabled, the "back" decal (built while modelGroup is
    // rotated 180°) was occluded by the shirt's own opaque geometry —
    // `polygonOffsetFactor` alone wasn't enough to keep it in front in
    // that orientation, even though the exact same setup worked for
    // front. Since the editor camera is fixed and nothing else could ever
    // occlude this decal, disabling depthTest entirely (always draw on
    // top) is simpler and safer than hand-tuning the offset per side.
    depthTest: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    side: THREE.DoubleSide,
  });
  decalMesh = new THREE.Mesh(geometry, material);
  modelGroup?.add(decalMesh);

  if (pendingTexture) updateTexture(pendingTexture);
}

// The editor is 3D-only now — no flat mockup photo exists that the
// design could be composited onto for "Eksport" (that old flow drew the
// design over a static image using printArea percentages tuned for the
// decal projection, producing a mismatched result once those percentages
// changed). Exporting a snapshot of the actual rendered frame is what the
// user sees, always in sync.
function exportSnapshot(): string {
  if (!renderer) return '';
  return renderer.domElement.toDataURL('image/png', 1);
}

function updateTexture(dataUrl: string) {
  pendingTexture = dataUrl;
  if (!decalMesh) return;
  // `textureLoader.load` is async — if `buildDecalAt` rebuilds `decalMesh`
  // (e.g. a side switch or resize) while this load is in flight, applying
  // the loaded texture to the now-stale `material` closure would silently
  // vanish onto a disposed, no-longer-displayed mesh.
  const targetMesh = decalMesh;
  const material = targetMesh.material as THREE.MeshBasicMaterial;
  textureLoader.load(dataUrl, (tex) => {
    if (targetMesh !== decalMesh) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    // The "back" decal is projected onto a mesh that's been rotated 180°
    // (see applySide) rather than viewed from a mirrored camera — that
    // flips the handedness DecalGeometry derives its UV basis from, so
    // text/designs come out mirrored left-right. Flipping the texture's
    // own U axis for that side cancels it back out to normal reading
    // order.
    if (props.viewSide === 'back') {
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
    }
    else {
      tex.repeat.x = 1;
      tex.offset.x = 0;
    }
    material.map?.dispose();
    material.map = tex;
    material.needsUpdate = true;
  });
}

function applyColor(hex: string) {
  allMeshes.forEach((mesh) => {
    (mesh.material as THREE.MeshStandardMaterial).color.set(hex);
  });
}

function applySide(side: GarmentSide) {
  // Rotate the whole model 180° for "back" rather than moving the camera —
  // keeps lighting/framing identical between the two fixed views.
  if (modelGroup) modelGroup.rotation.y = side === 'back' ? Math.PI : 0;
  if (modelGroup) buildDecalAt(modelGroup);
}

async function init() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  scene = new THREE.Scene();
  scene.background = null;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(0, 0.1, 3.4);
  resize();

  scene.add(new THREE.AmbientLight(0xffffff, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-3, 1, -2);
  scene.add(fill);
  // Co-located with the camera so the surface the user is actually
  // looking at is always well-lit head-on — the angled key/fill lights
  // alone leave front-facing garment panels in partial shadow (a duller,
  // grayer look than a real product photo).
  const headlight = new THREE.DirectionalLight(0xffffff, 0.8);
  headlight.position.set(0, 0.1, 3.4);
  scene.add(headlight);

  const gltf = await loadGLTFCached(MODEL_URLS[props.garment]);
  if (disposed) return;
  const model = gltf.scene.clone(true);

  // Scale FIRST, then measure/recenter — subtracting the unscaled center
  // from position and only then scaling silently multiplies that offset by
  // the scale factor, flinging large-local-origin models (e.g. exported at
  // real-world cm scale, pivot far from the mesh) miles outside the camera
  // frustum. Recentering after scaling keeps this correct for any source
  // model regardless of its original pivot/units.
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
  // geometry — each one covers a different region) — all of them are
  // needed for full coverage. Clone each one's material so a color tint
  // applies uniformly and doesn't mutate the shared cached asset.
  allMeshes = [];
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const material = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
      // Some source models bake shading/AO into the baseColor (and an
      // identical emissive) texture — a photographed-fabric look that
      // stays dark regardless of `.color`, so a "white" swatch pick never
      // visibly whitens it. Stripping those maps makes the flat `.color`
      // tint (set below by applyColor) the actual visible garment color.
      material.map?.dispose();
      material.map = null;
      material.emissiveMap?.dispose();
      material.emissiveMap = null;
      material.emissive.set(0x000000);
      material.transparent = false;
      material.opacity = 1;
      // Different source .glb files bake different roughness/metalness
      // values — left as-is, the same white .color renders visibly
      // grayer on one garment than another under identical lighting.
      // Fixing these to one fabric-like value keeps "white" the same
      // shade across every garment.
      material.roughness = 0.85;
      material.metalness = 0;
      mesh.material = material;
      mesh.geometry.computeVertexNormals();
      allMeshes.push(mesh);
    }
  });

  applyColor(props.shirtColor);
  applySide(props.viewSide);

  loading.value = false;
  renderLoop();
}

function renderLoop() {
  if (disposed) return;
  rafId = requestAnimationFrame(renderLoop);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

watch(() => props.viewSide, applySide);
watch(() => props.shirtColor, applyColor);
watch(() => props.printArea, () => {
  if (modelGroup) buildDecalAt(modelGroup);
});

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

defineExpose({ updateTexture, exportSnapshot });
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full"
  >
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center"
    >
      <Icon
        name="lucide:loader-2"
        class="h-6 w-6 animate-spin text-secondary-600"
      />
    </div>
    <canvas
      ref="canvasRef"
      class="h-full w-full"
    />
  </div>
</template>
