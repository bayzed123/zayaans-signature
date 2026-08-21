import { describe, expect, it } from "vitest";
import type { Pose } from "@tensorflow-models/pose-detection";
import {
  applyAdjustment,
  computeGarmentPlacement,
  extractBodyKeypoints,
  fallbackPlacement,
  NEUTRAL_ADJUSTMENT,
} from "../client/src/lib/tryOn";

function pose(
  overrides: Partial<
    Record<string, { x: number; y: number; score: number }>
  > = {}
): Pose {
  const base = {
    left_shoulder: { x: 100, y: 200, score: 0.9 },
    right_shoulder: { x: 200, y: 200, score: 0.9 },
    left_hip: { x: 110, y: 350, score: 0.9 },
    right_hip: { x: 190, y: 350, score: 0.9 },
  };
  const merged = { ...base, ...overrides };
  return {
    keypoints: Object.entries(merged).map(([name, point]) => ({
      name,
      x: point.x,
      y: point.y,
      score: point.score,
    })),
  } as Pose;
}

describe("virtual try-on placement", () => {
  it("extracts confident shoulder and hip keypoints", () => {
    const keypoints = extractBodyKeypoints(pose());
    expect(keypoints).toEqual({
      leftShoulder: { x: 100, y: 200 },
      rightShoulder: { x: 200, y: 200 },
      leftHip: { x: 110, y: 350 },
      rightHip: { x: 190, y: 350 },
    });
  });

  it("rejects a pose when any required landmark is missing or low-confidence", () => {
    expect(extractBodyKeypoints(undefined)).toBeNull();
    expect(
      extractBodyKeypoints(
        pose({ left_shoulder: { x: 100, y: 200, score: 0.1 } })
      )
    ).toBeNull();
  });

  it("centres the garment on the torso and scales it to shoulder width", () => {
    const keypoints = extractBodyKeypoints(pose())!;
    const placement = computeGarmentPlacement(keypoints, 0.8);
    // Shoulder midpoint is (150, 200); the garment should be horizontally centred there.
    expect(placement.x).toBe(150);
    expect(placement.y).toBeGreaterThan(200);
    expect(placement.width).toBeGreaterThan(0);
    expect(placement.height).toBeCloseTo(placement.width / 0.8);
    expect(placement.rotation).toBeCloseTo(0);
  });

  it("tilts the garment to match shoulder slope", () => {
    const keypoints = extractBodyKeypoints(
      pose({ right_shoulder: { x: 200, y: 240, score: 0.9 } })
    )!;
    const placement = computeGarmentPlacement(keypoints, 0.8);
    expect(placement.rotation).toBeGreaterThan(0);
  });

  it("leaves placement untouched under the neutral adjustment", () => {
    const keypoints = extractBodyKeypoints(pose())!;
    const placement = computeGarmentPlacement(keypoints, 0.8);
    expect(applyAdjustment(placement, NEUTRAL_ADJUSTMENT)).toEqual(placement);
  });

  it("applies manual nudges on top of the automatic placement", () => {
    const keypoints = extractBodyKeypoints(pose())!;
    const placement = computeGarmentPlacement(keypoints, 0.8);
    const adjusted = applyAdjustment(placement, {
      offsetX: 10,
      offsetY: -5,
      scale: 1.5,
      rotationOffset: 0.2,
    });
    expect(adjusted.x).toBe(placement.x + 10);
    expect(adjusted.y).toBe(placement.y - 5);
    expect(adjusted.width).toBeCloseTo(placement.width * 1.5);
    expect(adjusted.rotation).toBeCloseTo(placement.rotation + 0.2);
  });

  it("falls back to a centred placement when no pose was detected", () => {
    const placement = fallbackPlacement(1000, 1400, 0.8);
    expect(placement.x).toBe(500);
    expect(placement.rotation).toBe(0);
    expect(placement.width).toBeLessThan(1000);
  });
});
