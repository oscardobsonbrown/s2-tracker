import { describe, expect, test } from "vitest";
import {
  applyInertiaMotion,
  autoRotationSpeed,
  getFrameScale,
  getMotionMode,
  getReleaseAngularVelocity,
  getTargetRotationSpeed,
  maxFrameScale,
  releaseVelocityIdleWindow,
  thetaMax,
} from "../app/(home)/components/cobe-globe-motion";

describe("cobe globe motion", () => {
  test("caps long frame gaps before applying inertia", () => {
    expect(
      getFrameScale({
        lastFrameTime: 100,
        now: 100 + 16.67 * 10,
      })
    ).toBe(maxFrameScale);
  });

  test("zeros release velocity after the pointer has been idle", () => {
    expect(
      getReleaseAngularVelocity({
        angularVelocityPhi: 0.09,
        angularVelocityTheta: 0.05,
        idleTime: releaseVelocityIdleWindow,
        isReducedMotion: false,
        isTagOpen: false,
      })
    ).toEqual({
      angularVelocityPhi: 0,
      angularVelocityTheta: 0,
    });
  });

  test("decays release velocity during a short idle window", () => {
    expect(
      getReleaseAngularVelocity({
        angularVelocityPhi: 0.08,
        angularVelocityTheta: 0.04,
        idleTime: releaseVelocityIdleWindow / 2,
        isReducedMotion: false,
        isTagOpen: false,
      })
    ).toEqual({
      angularVelocityPhi: 0.04,
      angularVelocityTheta: 0.02,
    });
  });

  test("keeps inertia motion within the vertical clamp", () => {
    expect(
      applyInertiaMotion({
        angularVelocityPhi: 0.03,
        angularVelocityTheta: 0.05,
        frameScale: maxFrameScale,
        isDragging: false,
        phi: 0.2,
        shouldPause: false,
        theta: thetaMax - 0.01,
      })
    ).toMatchObject({
      phi: 0.26,
      theta: thetaMax,
      angularVelocityTheta: 0,
    });
  });

  test("resumes autoplay only after inertia has finished", () => {
    expect(
      getMotionMode({
        angularVelocityPhi: 0.01,
        angularVelocityTheta: 0,
        isDragging: false,
        isReducedMotion: false,
        isTagOpen: false,
        rotationSpeed: autoRotationSpeed,
      })
    ).toBe("inertia");

    expect(
      getTargetRotationSpeed({
        angularVelocityPhi: 0.01,
        isDragging: false,
        isReducedMotion: false,
        isTagOpen: false,
      })
    ).toBeLessThan(autoRotationSpeed);

    expect(
      getMotionMode({
        angularVelocityPhi: 0,
        angularVelocityTheta: 0,
        isDragging: false,
        isReducedMotion: false,
        isTagOpen: false,
        rotationSpeed: autoRotationSpeed,
      })
    ).toBe("autoplay");
  });
});
