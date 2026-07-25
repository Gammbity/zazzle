import type { fabric } from 'fabric';

const GUIDE_COLOR = '#f43f5e';
const SNAP_THRESHOLD = 6;
const ROTATE_SNAP_STEP = 45;
const ROTATE_SNAP_EPSILON = 0.5;

type CanvasWithContextTop = fabric.Canvas & { contextTop: CanvasRenderingContext2D };

// Figma-style smart guides: while dragging or resizing an object on the
// print-area canvas, a dashed line appears whenever its center/edges land
// on the canvas's center, thirds, or quarters — and dragging snaps to that
// exact position so designs land precisely centered or evenly split
// without eyeballing it.
export function useAlignmentGuides(canvas: Ref<fabric.Canvas | null>, size: Ref<{ width: number; height: number }> | ComputedRef<{ width: number; height: number }>) {
  function guidePositions(dimension: number): number[] {
    return [0, dimension / 4, dimension / 3, dimension / 2, (dimension * 2) / 3, (dimension * 3) / 4, dimension];
  }

  function clearGuides() {
    const c = canvas.value as CanvasWithContextTop | null;
    if (!c?.contextTop) return;
    c.clearContext(c.contextTop);
  }

  function drawGuide(axis: 'x' | 'y', pos: number) {
    const c = canvas.value as CanvasWithContextTop | null;
    if (!c?.contextTop) return;
    const ctx = c.contextTop;
    ctx.save();
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (axis === 'x') {
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, c.getHeight());
    }
    else {
      ctx.moveTo(0, pos);
      ctx.lineTo(c.getWidth(), pos);
    }
    ctx.stroke();
    ctx.restore();
  }

  function closestGuide(value: number, guides: number[]): number | null {
    let closest: number | null = null;
    let bestDelta = SNAP_THRESHOLD;
    for (const g of guides) {
      const delta = Math.abs(g - value);
      if (delta < bestDelta) {
        bestDelta = delta;
        closest = g;
      }
    }
    return closest;
  }

  function snapOnMove(e: fabric.IEvent) {
    const obj = e.target;
    if (!obj) return;
    clearGuides();

    const { width: canvasW, height: canvasH } = size.value;
    const bound = obj.getBoundingRect(true, true);
    const centerX = bound.left + bound.width / 2;
    const centerY = bound.top + bound.height / 2;

    const snappedX = closestGuide(centerX, guidePositions(canvasW));
    const snappedY = closestGuide(centerY, guidePositions(canvasH));

    if (snappedX !== null) {
      obj.left = (obj.left ?? 0) + (snappedX - centerX);
      drawGuide('x', snappedX);
    }
    if (snappedY !== null) {
      obj.top = (obj.top ?? 0) + (snappedY - centerY);
      drawGuide('y', snappedY);
    }
    if (snappedX !== null || snappedY !== null) obj.setCoords();
  }

  // Resizing doesn't snap the geometry itself (that would fight the
  // handle the user is actively dragging) — it just surfaces the same
  // guide lines when an edge or center happens to land on one, as a
  // visual cue.
  function showGuidesOnScale(e: fabric.IEvent) {
    const obj = e.target;
    if (!obj) return;
    clearGuides();

    const { width: canvasW, height: canvasH } = size.value;
    const bound = obj.getBoundingRect(true, true);
    const left = bound.left;
    const right = bound.left + bound.width;
    const top = bound.top;
    const bottom = bound.top + bound.height;
    const centerX = left + bound.width / 2;
    const centerY = top + bound.height / 2;

    const xGuides = guidePositions(canvasW);
    const yGuides = guidePositions(canvasH);
    const xHit = closestGuide(left, xGuides) ?? closestGuide(right, xGuides) ?? closestGuide(centerX, xGuides);
    const yHit = closestGuide(top, yGuides) ?? closestGuide(bottom, yGuides) ?? closestGuide(centerY, yGuides);
    if (xHit !== null) drawGuide('x', xHit);
    if (yHit !== null) drawGuide('y', yHit);
  }

  // Fabric's own `snapAngle`/`snapThreshold` (set on the object prototype
  // by the stage components) already round `obj.angle` to the nearest 45°
  // step while rotating, before this handler ever runs — this just draws
  // a guide line out from the center at that angle so the snap is visible,
  // the same way position-snapping shows a line.
  function drawRotationIndicator(obj: fabric.Object) {
    const c = canvas.value as CanvasWithContextTop | null;
    if (!c?.contextTop) return;
    const center = obj.getCenterPoint();
    const angleRad = ((obj.angle ?? 0) * Math.PI) / 180;
    const radius = Math.max(c.getWidth(), c.getHeight());
    const x2 = center.x + radius * Math.sin(angleRad);
    const y2 = center.y - radius * Math.cos(angleRad);
    const ctx = c.contextTop;
    ctx.save();
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function snapOnRotate(e: fabric.IEvent) {
    const obj = e.target;
    if (!obj) return;
    clearGuides();
    const angle = ((obj.angle ?? 0) % 360 + 360) % 360;
    const nearest = Math.round(angle / ROTATE_SNAP_STEP) * ROTATE_SNAP_STEP;
    const delta = Math.min(Math.abs(angle - nearest), 360 - Math.abs(angle - nearest));
    if (delta < ROTATE_SNAP_EPSILON) drawRotationIndicator(obj);
  }

  function attach(c: fabric.Canvas) {
    c.on('object:moving', snapOnMove);
    c.on('object:scaling', showGuidesOnScale);
    c.on('object:rotating', snapOnRotate);
    c.on('mouse:up', clearGuides);
    c.on('selection:cleared', clearGuides);
  }

  function detach(c: fabric.Canvas) {
    c.off('object:moving', snapOnMove);
    c.off('object:scaling', showGuidesOnScale);
    c.off('object:rotating', snapOnRotate);
    c.off('mouse:up', clearGuides);
    c.off('selection:cleared', clearGuides);
  }

  return { attach, detach };
}
