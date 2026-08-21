/**
 * Virtual try-on: fits a garment image over a customer's own photo using
 * on-device pose detection. Everything here runs in the browser -- the photo
 * never leaves the device, nothing is uploaded, and nothing is cached to
 * disk. TensorFlow.js and the pose model are only downloaded (from a CDN,
 * cached by the browser like any other asset) the first time a shopper opens
 * the try-on tool, not on every page load.
 */
import type { Pose } from "@tensorflow-models/pose-detection";

export type BodyKeypoints = {
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip: { x: number; y: number };
  rightHip: { x: number; y: number };
};

const REQUIRED_KEYPOINTS = [
  "left_shoulder",
  "right_shoulder",
  "left_hip",
  "right_hip",
] as const;
const MIN_CONFIDENCE = 0.35;

/** Picks out the four landmarks the garment placement math needs, if confident enough. */
export function extractBodyKeypoints(
  pose: Pose | undefined
): BodyKeypoints | null {
  if (!pose?.keypoints) return null;
  const byName = new Map(pose.keypoints.map(point => [point.name, point]));
  const points = REQUIRED_KEYPOINTS.map(name => byName.get(name));
  if (points.some(point => !point || (point.score ?? 0) < MIN_CONFIDENCE))
    return null;
  const [leftShoulder, rightShoulder, leftHip, rightHip] =
    points as NonNullable<(typeof points)[number]>[];
  return {
    leftShoulder: { x: leftShoulder.x, y: leftShoulder.y },
    rightShoulder: { x: rightShoulder.x, y: rightShoulder.y },
    leftHip: { x: leftHip.x, y: leftHip.y },
    rightHip: { x: rightHip.x, y: rightHip.y },
  };
}

export type GarmentPlacement = {
  /** Centre of the garment, in the same pixel space as the source photo. */
  x: number;
  y: number;
  /** Width the garment should be drawn at, derived from shoulder span. */
  width: number;
  height: number;
  /** Rotation to match shoulder tilt, in radians. */
  rotation: number;
};

/**
 * Turns detected body landmarks into a garment placement: centred on the
 * torso, scaled to shoulder width, tilted to match shoulder slope. The
 * garment's own aspect ratio decides its height.
 */
export function computeGarmentPlacement(
  keypoints: BodyKeypoints,
  garmentAspectRatio: number,
  options?: { widthMultiplier?: number; verticalOffset?: number }
): GarmentPlacement {
  const widthMultiplier = options?.widthMultiplier ?? 2.05;
  const verticalOffset = options?.verticalOffset ?? 0.08;

  const shoulderMidX =
    (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2;
  const shoulderMidY =
    (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2;
  const hipMidX = (keypoints.leftHip.x + keypoints.rightHip.x) / 2;
  const hipMidY = (keypoints.leftHip.y + keypoints.rightHip.y) / 2;

  const shoulderSpan = Math.hypot(
    keypoints.rightShoulder.x - keypoints.leftShoulder.x,
    keypoints.rightShoulder.y - keypoints.leftShoulder.y
  );
  const torsoHeight = Math.hypot(
    hipMidX - shoulderMidX,
    hipMidY - shoulderMidY
  );

  const width = shoulderSpan * widthMultiplier;
  const height = width / garmentAspectRatio;
  const rotation = Math.atan2(
    keypoints.rightShoulder.y - keypoints.leftShoulder.y,
    keypoints.rightShoulder.x - keypoints.leftShoulder.x
  );

  return {
    x: shoulderMidX,
    y: shoulderMidY + torsoHeight * verticalOffset,
    width,
    height,
    rotation,
  };
}

/** A garment image the shopper can nudge by hand after the automatic fit. */
export type TryOnAdjustment = {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationOffset: number;
};

export const NEUTRAL_ADJUSTMENT: TryOnAdjustment = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotationOffset: 0,
};

/** Merges the automatic placement with the shopper's manual fine-tuning. */
export function applyAdjustment(
  placement: GarmentPlacement,
  adjustment: TryOnAdjustment
): GarmentPlacement {
  return {
    x: placement.x + adjustment.offsetX,
    y: placement.y + adjustment.offsetY,
    width: placement.width * adjustment.scale,
    height: placement.height * adjustment.scale,
    rotation: placement.rotation + adjustment.rotationOffset,
  };
}

/** A safe, centred fallback used whenever no pose could be detected. */
export function fallbackPlacement(
  photoWidth: number,
  photoHeight: number,
  garmentAspectRatio: number
): GarmentPlacement {
  const width = photoWidth * 0.62;
  const height = width / garmentAspectRatio;
  return {
    x: photoWidth / 2,
    y: photoHeight * 0.4,
    width,
    height,
    rotation: 0,
  };
}
